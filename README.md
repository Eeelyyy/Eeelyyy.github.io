# Yishen Liu · Homepage

这是 `Eeelyyy/Eeelyyy.github.io` 的本地开发工作区，网站继续使用 [eeelyyy.github.io](https://eeelyyy.github.io/)。

已整理 Codex 工作约定、CV 数据和视觉参考。当前 `index.html` 保留原站，尚未进行视觉重设计。

## 开始

使用 Node.js 20+，无需安装第三方依赖。在项目目录运行：

```text
npm run dev
```

打开 `http://127.0.0.1:4173/`。修改网页文件后刷新即可；按 Ctrl+C 停止。`npm run dev -- --port 4174` 可更换端口。

```text
npm run check
npm run build
```

前者检查内容与素材，后者生成只包含公开运行资源的 `dist/`。构建不会发布网站。原始 CV 和文档不会进入该目录。

## 目录

| 路径 | 用途 |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Codex 的项目说明、内容规则、操作与发布约定 |
| [content/profile.json](content/profile.json) | 从 CV 整理的公开结构化资料 |
| [docs/CONTENT.md](docs/CONTENT.md) | 内容来源、状态、缺失素材与更新方式 |
| [docs/DESIGN.md](docs/DESIGN.md) | 五张参考图的解读、配色和版式建议 |
| [figs/manifest.json](figs/manifest.json) | 图片尺寸、文件哈希、描述与使用建议 |
| `figs/*.png` | 用户提供的原始视觉参考，保留不变 |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | 运行、认证、构建与 GitHub Pages 发布说明 |
| [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) | 工作区基线与后续改版入口 |
| `private/cv-original.tex` | 本机原始 CV，已加入 Git 忽略 |
| `private/github-access.json` | 本机认证检查报告，不含 token，已忽略 |
| `index.html` | 当前旧网站入口，后续改版从这里开始 |
| `scripts/` | 无依赖开发工具与本机 GitHub 认证辅助脚本 |

## 交给 Codex

在这个目录打开任务即可。可直接使用：

> 读取 AGENTS.md，基于 content/profile.json 和 figs/ 完成主页重设计，先给我本地预览。

## 来源

个人资料来自用户于 2026-11-16 提供的 CV；视觉素材来自用户的 `figs/`。学术状态按用户资料保留，没有自行升级投稿状态。

Codex 工作约定的文件名称参考 [OpenAI 的 AGENTS.md 文档](https://learn.chatgpt.com/docs/agent-configuration/agents-md)。
