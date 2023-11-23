#!/bin/bash

# -type d/f/l
# d -> 目录，f -> 普通文件，l -> 符号链接
find $1 -type d -name $2 -exec rm -rf {} +
