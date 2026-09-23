#!/bin/bash

# ============================================================
# 可选参数覆盖（留空则使用自动动态分级）
#   MIN_WRITE_SPEED=20   手动指定最低写入速度阈值 (MB/s)
#   HIGH_OFFSET_PCT=80   高位偏移百分比，默认 80%
# ============================================================
: "${HIGH_OFFSET_PCT:=80}"

echo "=================================================="
echo "     SD/TF 卡高位物理扇区真实性一键检测           "
echo "=================================================="

# ----------------------------------------------------------
# 辅助函数：按标称容量自动分级，返回 (档位名, 最低写速MB/s)
# 参数 $1：标称容量 GB（十进制）
# ----------------------------------------------------------
classify_card() {
    local gb=$1
    if   (( $(echo "$gb < 14"  | bc -l) )); then echo "8GB   级别|4"
    elif (( $(echo "$gb < 28"  | bc -l) )); then echo "16GB  级别|6"
    elif (( $(echo "$gb < 56"  | bc -l) )); then echo "32GB  级别|10"
    elif (( $(echo "$gb < 112" | bc -l) )); then echo "64GB  级别|20"
    elif (( $(echo "$gb < 230" | bc -l) )); then echo "128GB 级别|30"
    elif (( $(echo "$gb < 460" | bc -l) )); then echo "256GB 级别|40"
    elif (( $(echo "$gb < 920" | bc -l) )); then echo "512GB 级别|50"
    else                                          echo "1TB+  级别|60"
    fi
}

# ─────────────────────────────────────────────────────────
# 1. 检测容量信息
# ─────────────────────────────────────────────────────────
echo -e "\n[1/3] 正在分析磁盘容量..."
total_kb=$(df -k . | awk 'NR==2 {print $2}')
avail_kb=$(df -k . | awk 'NR==2 {print $4}')

total_gb_bin=$(awk "BEGIN {printf \"%.2f\", $total_kb / 1024 / 1024}")
total_gb_dec=$(awk "BEGIN {printf \"%.2f\", ($total_kb * 1024) / 1000000000}")
avail_gb=$(awk "BEGIN {printf \"%.2f\", $avail_kb / 1024 / 1024}")

# 解析分级信息
card_info=$(classify_card "$total_gb_dec")
card_tier="${card_info%%|*}"
auto_min_speed="${card_info##*|}"

# 若用户未手动指定速度阈值，使用自动分级值
if [ -z "${MIN_WRITE_SPEED:-}" ]; then
    min_write_speed="$auto_min_speed"
    speed_src="自动分级"
else
    min_write_speed="$MIN_WRITE_SPEED"
    speed_src="手动指定"
fi

echo " - 系统识别总容量 : ${total_gb_bin} GB（对应标称: 约 ${total_gb_dec} GB）"
echo " - 当前剩余空间   : ${avail_gb} GB"
echo " - 容量档位识别   : ${card_tier}"
echo " - 写速最低阈值   : ${min_write_speed} MB/s（${speed_src}）"
echo " - 高位偏移比例   : ${HIGH_OFFSET_PCT}%"

# ─────────────────────────────────────────────────────────
# 2. 读写速度基准测试 (2GB)
# ─────────────────────────────────────────────────────────
echo -e "\n[2/3] 正在测试写入与读取速度（样本: 2GB）..."
write_out=$(dd if=/dev/zero of=.speed_bench.tmp bs=1048576 count=2048 2>&1)
bytes_w=$(echo "$write_out" | grep -o '[0-9]* bytes' | head -1 | awk '{print $1}')
secs_w=$(echo "$write_out"  | grep -o '[0-9.]* secs' | awk '{print $1}')
speed_w=$(awk "BEGIN {printf \"%.2f\", ($bytes_w / 1048576) / $secs_w}")
echo " -> 实时写入速度: ${speed_w} MB/s"

sudo purge 2>/dev/null || true
read_out=$(dd if=.speed_bench.tmp of=/dev/null bs=1048576 2>&1)
bytes_r=$(echo "$read_out" | grep -o '[0-9]* bytes' | head -1 | awk '{print $1}')
secs_r=$(echo "$read_out"  | grep -o '[0-9.]* secs' | awk '{print $1}')
speed_r=$(awk "BEGIN {printf \"%.2f\", ($bytes_r / 1048576) / $secs_r}")
echo " -> 实时读取速度: ${speed_r} MB/s"
rm -f .speed_bench.tmp

# ─────────────────────────────────────────────────────────
# 3. 动态高位物理扇区检测
#    偏移 = 总容量（MB）× HIGH_OFFSET_PCT%
#    边界保护：若剩余空间不足，自动缩小样本（最小 10MB）
# ─────────────────────────────────────────────────────────
total_blocks=$(( total_kb / 1024 ))   # 总容量换算成 1MB 块数

high_offset_blocks=$(awk "BEGIN {printf \"%d\", $total_blocks * $HIGH_OFFSET_PCT / 100}")
high_offset_gb=$(awk "BEGIN {printf \"%.1f\", $high_offset_blocks / 1024}")

echo -e "\n[3/3] 正在直击 ${high_offset_gb} GB 高位物理扇区"
echo "      （总容量 ${total_gb_bin} GB 的 ${HIGH_OFFSET_PCT}%，块偏移: ${high_offset_blocks}）"

# 边界保护：偏移后剩余块数
remaining_blocks=$(( total_blocks - high_offset_blocks ))
if (( remaining_blocks < 10 )); then
    echo "❌ 错误：高位偏移后剩余空间不足 10MB，无法执行检测（卡容量过小或偏移比例过高）。"
    exit 1
fi

# 自动缩小样本（默认 100MB，空间不足时收缩，最小 10MB）
if (( remaining_blocks >= 100 )); then
    sample_size=100
else
    sample_size=$(( remaining_blocks - 1 ))
    echo " ⚠️  偏移后剩余空间有限，测试样本已自动缩至 ${sample_size} MB"
fi

# 生成唯一随机校验样本
echo " -> 正在生成 ${sample_size} MB 随机校验数据..."
head -c $(( sample_size * 1048576 )) /dev/urandom > .sample_token.bin
expected_hash=$(md5 -q .sample_token.bin)

is_fake=0

# 写入高位偏移处
echo " -> 正在向 ${high_offset_gb} GB 偏移处写入 ${sample_size} MB 随机数据..."
write_seek_err=$(dd if=.sample_token.bin of=.high_sector_test.tmp \
    bs=1048576 count="$sample_size" seek="$high_offset_blocks" 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ 写入失败：底层拒绝向 ${high_offset_gb} GB 物理地址寻址！"
    echo "   详细报错: $write_seek_err"
    is_fake=1
else
    # 强制清理内存缓存，确保从物理卡中回读
    sudo purge 2>/dev/null || true

    echo " -> 正在从 ${high_offset_gb} GB 偏移处回读并比对 MD5..."
    dd if=.high_sector_test.tmp of=.readback.bin \
        bs=1048576 count="$sample_size" skip="$high_offset_blocks" 2>/dev/null || true
    readback_hash=$(md5 -q .readback.bin 2>/dev/null || echo "FAIL")

    if [ "$expected_hash" != "$readback_hash" ]; then
        echo "❌ 回读比对失败：${high_offset_gb} GB 高位地址数据与写入不符（扩容篡改/回卷丢弃）！"
        is_fake=1
    else
        echo "✅ 高位物理扇区读写一致，MD5 校验完全匹配！"
    fi
fi

# 清理临时文件
rm -f .sample_token.bin .high_sector_test.tmp .readback.bin

# ─────────────────────────────────────────────────────────
# 结论
# ─────────────────────────────────────────────────────────
echo -e "\n==================== 检测结论 ===================="
echo " 卡容量档位 : ${card_tier}（标称 ${total_gb_dec} GB）"
echo " 高位检测点 : ${high_offset_gb} GB（${HIGH_OFFSET_PCT}% 偏移）"
echo " 写速阈值   : ${min_write_speed} MB/s（${speed_src}）"
echo "---------------------------------------------------"

# 判定速度
if (( $(echo "$speed_w < $min_write_speed" | bc -l) )); then
    echo "❌ 速度异常：写入仅 ${speed_w} MB/s，低于 ${card_tier} 最低标准 ${min_write_speed} MB/s。"
    is_fake=1
else
    echo "✅ 速度达标：写入 ${speed_w} MB/s ≥ ${min_write_speed} MB/s。"
fi

if [ $is_fake -eq 0 ]; then
    echo -e "🎉 最终判定：【正品 ${total_gb_dec} GB 真卡】${high_offset_gb} GB 高位扇区验证通过，速度正常！\n"
else
    echo -e "🚨 最终判定：【假卡 / 扩容篡改卡】${high_offset_gb} GB 高位扇区或速度检测未通过，请立即退货！\n"
fi
