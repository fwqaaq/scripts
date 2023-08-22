#!/bin/bash

# 将 3389 端口转发到本机的 11111 端口
# 杀死，ps -ux | grep socat
socat tcp-listen:11111,reuseaddr,fork tcp4:192.168.50.7:3389 &
