#!/bin/bash

cidr=$1

IFS='/' read ip mask <<< "$cidr"

bin_ip=$(printf '%08d%08d%08d%08d\n' $(echo "$ip" | sed -e 's/\./\n/g' | while read dec; do echo "obase=2;$dec" | bc; done))

# 计算网络地址和广播地址
network=$(echo "$bin_ip" | cut -c1-$mask)
network=$(printf '%s%s' $network $(head -c $((32-mask)) < /dev/zero | tr '\0' '0'))

ip1=$(echo $network | cut -c1-8)
ip2=$(echo $network | cut -c9-16)
ip3=$(echo $network | cut -c17-24)

o1=$((2#$ip1))
o2=$((2#$ip2))
o3=$((2#$ip3))

mask=$((2**(32-mask) - 1))

for i in {1..255}
do
  ip="$o1.$o2.$o3.$i"
  # 在后台运行 ping 命令
  ping -c 1 -W 1.2 "$ip" > /dev/null 2>&1 &
  pid=$!  # 获取最近一个后台进程的 PID

  # 等待 ping 命令结束
  wait $pid
  status=$?  # 获取 ping 命令的退出状态

  # 根据 ping 命令的结果输出信息
  if [ $status -eq 0 ]; then
      echo "Ping $ip successful"
  else
      echo "Ping $ip failed"
  fi
done
