# clay-portfolio-fun

任博文的搞怪粘土风个人网站，React 19 + Vite 8 + TypeScript。

- 线上地址：https://renbowen.qzz.io/clay-portfolio-fun/
- GitHub Pages 镜像：https://bowenren-andrew.github.io/clay-portfolio-fun/

## 本地运行

```powershell
npm install
npm run dev
```

打开 http://127.0.0.1:5175/clay-portfolio-fun/ 。

生产构建与预览：

```powershell
npm run build
npm run preview
```

预览地址为 http://127.0.0.1:4175/clay-portfolio-fun/ 。

## 部署

与 `bowenren-Andrew/clay-portfolio` 采用相同的 GitHub Pages 方案：

- 默认发布分支：`master`
- 自动部署文件：`.github/workflows/deploy.yml`
- push 到 `master` 后运行 `npm ci`、`npm run build`，通过 `upload-pages-artifact` 发布 `dist`
- Vite `base`：`/clay-portfolio-fun/`
- 自定义域名沿用用户站的 `renbowen.qzz.io`，项目页面位于 `/clay-portfolio-fun/`

## 验收

```powershell
$env:VERIFY_URL='http://127.0.0.1:4175/clay-portfolio-fun/'
npm run verify:ui
```

脚本会检查五章、图片解码、视频首帧、素材 HTTP 状态、播放条、弹窗、彩蛋、无 JS 骨架和两档截图。

详细产品和工程决策见 [DECISIONS.md](./DECISIONS.md)。
