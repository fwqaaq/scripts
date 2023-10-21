#!/bin/bash

# 将 3389 端口转发到本机的 11111 端口，如果公网只有 IPv6，
# 则监听端使用 v4（tcp4-listen），而转发的流量应该是 v6（tcp6）
socat tcp-listen:11111,reuseaddr,fork tcp4:192.168.50.7:3389 &
# 杀死，ps -ux | grep socat
