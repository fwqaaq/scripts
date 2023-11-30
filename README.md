# scripts

## tampermonkey

- [x] Github 网页图标增强功能，使你的 GitHub 网页图标焕然一新，[源码地址](./tampermonkey/github_web_icon_theme.js)、[下载地址](https://greasyfork.org/zh-CN/scripts/471272-github-网页图标主题)
- [x] 知乎自带的黑暗模式，[源码地址](./tampermonkey/zhihu_dark_mode.js)、[下载地址](https://greasyfork.org/zh-CN/scripts/481002-知乎黑暗模式) 

## shell

- [x] [rdp 端口连接转发](./shell/rdp_forward.sh)
- [x] postgresql 一键下载并开放端口，适用于 Debian/Ubuntu

  ```bash
  curl -sSL https://raw.githubusercontent.com/fwqaaq/scripts/main/shell/postgresql.sh | sudo bash
  ```

- [x] [一键更新 Git 所有提交信息的作者和邮箱](./shell/update_git_info.sh)
- [x] [快速使用 qemu 启动 iso 镜像](./shell/qemu_start.sh)
- [x] [使用 ping 命令检查 CIDR 地址中拥有的主机地址，仅支持 24 位主机号](./shell/ping_cidr.sh)
- [x] [删除目录下的所有指定文件](./shell/del_folder.sh)：第一个参数是**搜索的目录**，第二个参数是**删除的文件**
