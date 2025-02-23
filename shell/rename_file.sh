#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <path>/*.*; please provide a file list"
    exit 1
fi

for f in $1; do
    git mv "$f" "$(echo "$f" | tr "[:upper:]" "[:lower:]")"
done
