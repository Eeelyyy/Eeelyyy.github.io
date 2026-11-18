# 开发、认证与发布

## 本机工作区

- Git remote：`https://github.com/Eeelyyy/Eeelyyy.github.io.git`
- 分支：本地 `main` 跟踪 `origin/main`。
- 当前发布目标：GitHub Pages，保留 `https://eeelyyy.github.io/`。
- Node.js 20+；开发脚本只使用 Node 内置模块，`npm run` 可直接使用。

## 命令

| 命令 | 行为 |
| --- | --- |
| `npm run dev` | 在 `127.0.0.1:4173` 提供工作树中的网页资源，刷新即可看到修改 |
| `npm run dev -- --port 4174` | 指定其他本地端口 |
| `npm run content` | 从公开 JSON 同步 `index.html` 的标记资料区 |
| `npm run check` | 校验资料结构、素材哈希、研究关联、公开路径与 Git 文件边界 |
| `npm run build` | 重新生成 `dist/`，只复制公开运行资源，不发布 |
| `git diff --check` | 检查已跟踪改动中的空白问题 |
| `pwsh -NoProfile -File scripts/Connect-GitHub.ps1 -Check` | 验证已经保存的仓库凭据，输出安全的权限摘要 |

本地预览使用 HTTP，不要依赖双击 `index.html` 的 `file://` 行为。开发服务器只绑定本机回环地址，且不提供 `private/`、`.git/`、文档或工具脚本。

`scripts/site-files.mjs` 定义公开运行资源：`index.html`、`assets/` 下允许的文件、`content/profile.json`，以及存在时的 favicon、robots、sitemap、CNAME、`.nojekyll`。文档和原图不在构建输出中。需要上线的参考图必须先制作/复制到 `assets/images/` 并更新对应引用。

构建只重建已验证位于工作区内的 `dist/`，遇到符号链接会拒绝覆盖。开发服务器和构建脚本的资源边界保持一致。

## 页面实现与维护

- `assets/css/main.css`：暖白/黑/红/黄排版，760 px 与 1100 px 响应式断点，键盘焦点和 reduced-motion 样式。
- `assets/js/main.js`：Pointer Events 拖拽、带阻尼的回弹、Canvas 六边形力场与粒子；场景按钮与横向滑动、原生 details 的高度动画、一次性滚动入场。动画在离开视口或切换标签页后停止；Canvas 像素密度上限为 2。
- 拖动奶龙后松手回到起点；方向键移动，Enter / Space 触发力场，Escape 归位。手机在角色上拖动，图片区的纵向手势继续滚动网页。
- 页脚 Motion 按钮保存本机偏好；系统 reduced-motion 优先，互动改用静态反馈。没有持续闪烁、自动播放声音或分析追踪。
- 学术内容由 `scripts/profile-html.mjs` 生成到 HTML。修改 JSON 后运行 `npm run content`；`check` 和 `build` 校验内容同步，不依赖浏览器运行时加载资料。
- 三幅原图仅缩放/压缩为 WebP，9 个衍生文件在 `figs/manifest.json` 中登记。原图哈希保持不变。互动角色是代码绘制的 SVG 艺术素材。
- 浏览器验收临时脚本和截图位于被忽略的 `.cache/`、`artifacts/`。它们不属于运行依赖，也不进入提交或构建。

## GitHub Pages 资源边界

当前 Pages 使用 Jekyll 从 `main` 根目录发布，`_config.yml` 排除 `docs/`、`figs/`、`scripts/`、私有目录及开发文件，避免根目录发布把工作材料作为网站资源提供。不能添加 `.nojekyll` 绕过这些排除。`check` 会检查每个可提交文件是否属于运行资源、Jekyll 默认忽略路径或明确排除项；`_config.yml` 是发布配置，不进入 `dist/`。

排除规则参考 [Jekyll 官方配置说明](https://jekyllrb.com/docs/configuration/options/)。发布后还需要检查首页/资源返回 200、工作目录 URL 返回 404；不把本地构建通过当作远端验收。

## 凭据

用户已授权后续修改本仓库。凭据不写入 `AGENTS.md`、`.env`、Git remote、脚本或任何提交。Windows 上使用 Git Credential Manager 和系统 Credential Manager 保存；路径匹配限定为此仓库。

需要在本机配置或替换 token 时，在交互终端运行：

```text
pwsh -NoProfile -File scripts/Connect-GitHub.ps1
```

脚本会隐藏输入，先验证账号及仓库写权限，再通过标准输入交给 Git Credential Manager。它不会增加 token 权限。`-Check` 不要求重新输入 token，凭据不存在或失效时返回明确错误。

检查结果保存到被忽略的 `private/github-access.json`，仅包含账号、权限、检查时间和可读取的 Pages 配置，不包含 token。该报告是检查时的快照，不代表永久授权有效。

本机 Git 直连 GitHub 曾遇到连接重置，已在此仓库 `.git/config` 中使用 Windows 当前的本地代理 `http://127.0.0.1:7890`。这项设置没有提交。换电脑或代理不可用时，按实际网络修改/移除该仓库的代理设置，不要关闭 TLS 验证。

## 发布流程

工作区准备不需要推送或触发部署。后续用户要求改版并上线时，在授权范围内完成以下步骤：

1. `git fetch origin` 后检查本地、远端差异，不覆盖远端新增工作。
2. 完成实际页面修改，运行 `npm run check`、`npm run build`，检查桌面和手机预览及关键交互。
3. 检查 `git status` 和将要提交的 diff。原始 CV、认证报告、凭据和临时输出不得进入提交。
4. 根据实际 Pages 设置发布。使用 `private/github-access.json` 的检查结果或 GitHub Pages API / 设置页核对，不能把本地 `dist/` 的存在当作发布成功。
5. 若 Pages 从 `main` 根目录发布：根目录 `index.html` 和它引用的 `assets/`、`content/` 必须完整；普通提交并推送即可触发相应部署。`dist/` 在这种模式下是打包验证产物。
6. 若 Pages 使用 Actions：保留已有工作流并按实际情况上传构建产物。只有需要改变发布方式时才添加/调整工作流；不能无依据覆盖配置。
7. 验证远端提交与部署结果；访问网站确认可用后再报告“已上线”。失败时区分认证、构建、推送和部署失败。

不要 force-push、重写历史、改域名、迁移到另一托管服务或自动创建新网站。本次准备没有添加 GitHub Actions 工作流，也没有改变仓库 Pages 设置。

GitHub Pages 行为参考 [GitHub 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)。
