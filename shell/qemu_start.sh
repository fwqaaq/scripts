#!/bin/bash

function run_qemu(){
  local hda="$1"
  local cdrom="$2"

  cmd="qemu-system-x86_64 -machine type=q35,accel=kvm -device qemu-xhci -device usb-tablet -cpu host -rtc base=localtime -smp 4 -m 4G -hda $1"
  [[ -n "$cdrom" ]] && cmd="$cmd -cdrom $cdrom"
  eval "$cmd"
}

# Check if required tools are installed
for tool in qemu-img qemu-system-x86_64; do
  if ! type "$tool" > /dev/null 2>&1; then
    echo "Please install $tool"
    exit 1
  fi
done

# 截取名称
name=${1%.iso}

if ( [[ "$1" =~ "qcow2"$ ]] && [[ -f "$1" ]] ) || [[ -f "$name".qcow2 ]]; then
  images="$1"
  [[ "$1" =~ ".iso"$ ]] && images="$name.qcow2"
  run_qemu "$images"
  exit 0
fi


qemu-img create -f qcow2 "$name.qcow2" 10G
echo "Successly creating $name.qcow2 for you"

run_qemu "$name.qcow2" "$name.iso"