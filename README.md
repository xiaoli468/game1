# 色差研究所

一个无需后端、无需登录的 60 秒找不同色块小游戏，使用原生 HTML、CSS 和 JavaScript 构建。

## 本地预览

最简单的方法是直接双击 `index.html`。也可以在本目录启动一个静态服务器：

```powershell
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 部署

整个目录都是可直接部署的静态站点。可将本目录发布到 GitHub Pages、Cloudflare Pages、Netlify 或任意静态网站服务。

### GitHub Pages

1. 新建一个空的 GitHub 仓库。
2. 只把本目录内的文件上传到该仓库。
3. 在仓库的 **Settings → Pages** 中，将来源设为 **Deploy from a branch**。
4. 选择 `main` 分支和 `/ (root)`，保存后等待公开网址生成。

### Cloudflare Pages

1. 在 Cloudflare 控制台进入 **Workers & Pages → Create → Pages**。
2. 连接只包含本项目文件的 Git 仓库。
3. 构建命令留空，输出目录填写 `/`。
4. 点击部署，完成后会获得一个 `pages.dev` 公网网址。

