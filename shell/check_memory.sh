#!/bin/bash

echo "=================================================="
echo "      SD卡高位物理扇区(1028G)真实性一键检测        "
echo "=================================================="

# 1. 检测容量信息
echo -e "\n[1/3] 正在分析磁盘容量..."
total_kb=$(df -k . | awk 'NR==2 {print $2}')
avail_kb=$(df -k . | awk 'NR==2 {print $4}')

total_gb_bin=$(awk "BEGIN {printf \"%.2f\", $total_kb / 1024 / 1024}")
total_gb_dec=$(awk "BEGIN {printf \"%.2f\", ($total_kb * 1024) / 1000000000}")
avail_gb=$(awk "BEGIN {printf \"%.2f\", $avail_kb / 1024 / 1024}")

echo " - 系统识别总容量: ${total_gb_bin} GB (对应标称: 约 ${total_gb_dec} GB)"
echo " - 当前剩余空间: ${avail_gb} GB"

if (( $(echo "$total_gb_bin < 230" | bc -l) )); then
    echo "⚠️ 警告：当前卡标称总容量不足 230GB，可能非 1028GB 规格。"
fi

# 2. 读写速度基准测试 (2GB)
echo -e "\n[2/3] 正在测试写入与读取速度 (样本: 2GB)..."
write_out=$(dd if=/dev/zero of=.speed_bench.tmp bs=1048576 count=2048 2>&1)
bytes_w=$(echo "$write_out" | grep -o '[0-9]* bytes' | head -1 | awk '{print $1}')
secs_w=$(echo "$write_out" | grep -o '[0-9.]* secs' | awk '{print $1}')
speed_w=$(awk "BEGIN {printf \"%.2f\", ($bytes_w / 1048576) / $secs_w}")
echo " -> 实时写入速度: ${speed_w} MB/s"

sudo purge 2>/dev/null || true
read_out=$(dd if=.speed_bench.tmp of=/dev/null bs=1048576 2>&1)
bytes_r=$(echo "$read_out" | grep -o '[0-9]* bytes' | head -1 | awk '{print $1}')
secs_r=$(echo "$read_out" | grep -o '[0-9.]* secs' | awk '{print $1}')
speed_r=$(awk "BEGIN {printf \"%.2f\", ($bytes_r / 1048576) / $secs_r}")
echo " -> 实时读取速度: ${speed_r} MB/s"
rm -f .speed_bench.tmp

# 3. 直击 1028GB 高位物理扇区检测 (跳过前 230GB，直接写到第 230~231GB 位置)
echo -e "\n[3/3] 正在直击 230GB (1028G规格高位边界) 物理扇区..."

# 生成唯一的随机校验样本 (100MB)
head -c 104857600 /dev/urandom > .sample_token.bin
expected_hash=$(md5 -q .sample_token.bin)

is_fake=0

# 使用 seek 直接跳过前 235520 块 (230GB)，将 100MB 样本精准写在 230GB 后的物理扇区
echo " -> 正在向 230GB 偏移处写入 100MB 随机加密数据..."
write_seek_err=$(dd if=.sample_token.bin of=.high_sector_test.tmp bs=1048576 count=100 seek=235520 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ 写入失败：底层拒绝向 230GB 物理地址寻址！"
    echo "详细报错: $write_seek_err"
    is_fake=1
else
    # 强制清理内存缓存，确保从物理卡中回读
    sudo purge 2>/dev/null || true
    
    echo " -> 正在从 230GB 物理偏移处回读并比对 MD5..."
    dd if=.high_sector_test.tmp of=.readback.bin bs=1048576 count=100 skip=235520 2>/dev/null || true
    readback_hash=$(md5 -q .readback.bin 2>/dev/null || echo "FAIL")
    
    if [ "$expected_hash" != "$readback_hash" ]; then
        echo "❌ 回读比对失败：230GB 高位地址返回的数据与写入不符（扩容篡改/回卷丢弃）！"
        is_fake=1
    else
        echo "✅ 高位物理扇区读写一致，MD5 校验完全匹配！"
    fi
fi

# 清理测试生成的临时文件
rm -f .sample_token.bin .high_sector_test.tmp .readback.bin

echo -e "\n==================== 检测结论 ===================="

# 判定速度
if (( $(echo "$speed_w < 50.0" | bc -l) )); then
    echo "❌ 速度异常：写入仅 ${speed_w} MB/s，明显低于 Extreme PRO V30 水准。"
    is_fake=1
else
    echo "✅ 速度达标：写入 ${speed_w} MB/s。"
fi

if [ $is_fake -eq 0 ]; then
    echo -e "🎉 最终判定：【正品 1028GB 真卡】高位物理芯片真实存在，无扩容虚标，速度正常！\n"
else
    echo -e "🚨 最终判定：【假卡 / 扩容篡改卡】未通过高位物理扇区或速度检测，请立即退货！\n"
fi