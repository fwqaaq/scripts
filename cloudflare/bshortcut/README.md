# bilibili 视频下载快捷指令

部署到 worker 上

```bash
git clone git@github.com:fwqaaq/scripts.git
cd cloudflare/bshortcut && pnpm i
pnpx wrangler login && pnpx wrangler deploy
```

> [!NOTE]
> 如果想要下载 1080p 及以上的视频，需要登录 bilibili 账号，然后在 `wrangler.toml` 中将 SESSDATA 填入（在 b 站 Cookie 中）

这是 iCloud 快捷指令地址，点击即可：[bilibili 视频下载](https://www.icloud.com/shortcuts/3491c7f4ed244f53a9bb7e10d30423d3)
