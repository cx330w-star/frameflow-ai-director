# FrameFlow AI 导演台

面向电商 AI 素材制作的工作流原型。将参考画面的视觉语言与产品外观约束分开整理，输出可编辑、可复制、可导出的图片提示词和 8 秒视频分镜。

- [在线体验](https://cx330w-star.github.io/frameflow-ai-director/)
- [项目介绍](https://cx330w-star.github.io/frameflow-ai-director/case-study/)
- [载入示例](https://cx330w-star.github.io/frameflow-ai-director/?demo=1#workspace)

## 当前功能

参考图片 / 视频本地预览、视频三点抽帧、产品文字档案、模板提示词、可编辑分镜、重建提示词、复制与 JSON / TXT 导出。提供全量方案、按模式生成和项目介绍三个页面。

这是浏览器本地的静态演示版本，不包含真实视觉模型识别、图片 / 视频生成或服务端密钥。示例使用插画和虚构品牌，不代表客户案例。开发方式为 AI 辅助开发。

## 本地运行

需要 Node.js 22.13+。

```sh
npm install
npm run dev
```

构建到 GitHub Pages 项目路径：

```sh
BASE_PATH=/frameflow-ai-director/ npm run build
```

`dist/` 是构建输出。普通域名根路径部署可直接运行 `npm run build`。

## 发布

GitHub Pages 使用 `main` 分支的 `docs/` 目录，目录内是已构建的静态网页。`.nojekyll` 用于直接发布静态资源。

修改源码后重新构建，把 `dist/` 内容更新至 `docs/` 并提交。部署后需要以实际手机网络检查可达性；GitHub Pages 的发布成功不代表所有网络都能直连。
