# Yishen Liu — homepage 工作约定

## 目标与范围

- 为 Yishen Liu 持续开发个人研究主页。仓库是 `Eeelyyy/Eeelyyy.github.io`，沿用 `https://eeelyyy.github.io/` 和 GitHub Pages。
- 用户要求完整重设计；视觉来源是本仓库 `figs/`，个人内容来源是用户提供的 CV。不要沿用旧页面的姓名顺序、旧邮箱或卡片样式作为新版依据。
- 当前已完成奶龙 × EVA 极简主页改版；`docs/PROJECT_STATUS.md` 记录实际验收和发布状态。后续交付仍须区分本地、提交、推送与上线。
- 与用户用中文交流；网页初始使用英文，与 CV 一致。这是可调整的默认选择。

## 开始工作时读取

1. `README.md`：目录与运行命令。
2. `docs/PROJECT_STATUS.md`：当前状态、基线问题和下一步。
3. `content/profile.json` 与 `docs/CONTENT.md`：网页事实与准确表达。
4. `docs/DESIGN.md` 与 `figs/manifest.json`：视觉方向；实际打开相关原图后再设计。
5. 涉及预览、构建或上线时读取 `docs/DEVELOPMENT.md`。

## 内容规则

- `content/profile.json` 是可提交的结构化内容源；原始 CV 在被 Git 忽略的 `private/cv-original.tex`，用于本机核对。新 CV 到达后同步更新数据及来源日期。
- 保留日期、学位、单位和论文状态。HIT (Shenzhen) 是 **Sep. 2027 (Expected)** 的 Incoming Ph.D.；当前学位是 BIT 的 Vehicle Engineering M.Eng.。
- GroundingAnomaly：用户 CV 写明 **Accepted to ECCV 2026**。FlowSteer：**Submitted to CVPR 2027 / under review**。这些是用户提供的事实，不能表述为已经独立验证。
- FlowSteer 的研究起止时间和 Meitu 实习起止时间不同，应分别保留。不要自行改成同一段经历。
- 不编造完整作者名单、导师、录用状态、论文链接、奖项、实验设置或性能数字。保留缺失字段为 `null`，相应按钮不显示；不要做 `href="#"` 占位链接。
- 公开联系方式使用 CV 中的 Gmail、GitHub、Google Scholar。原始 CV 的手机号仅保留在本地原稿，默认不放网页；用户以后明确要求展示时再更新。
- 当前没有完整可下载 CV PDF、真实头像或论文配图。LaTeX 片段不等于可下载 PDF；参考图不等于论文实验结果。

## 视觉与实现

- 将 `figs/` 的留白、强烈光影、黑白结构和红黄点色转化为页面设计，具体参见 `docs/DESIGN.md`。避免退回通用蓝紫渐变、重复圆角卡片和模板式个人主页。
- 原始 PNG 不改名、不覆盖。上线用的压缩、裁切版本放在 `assets/images/`；用 `figs/manifest.json` 追溯来源。图中角色是艺术素材，不代表用户头像或研究成果。
- 保持论文、经历与联系方式清晰可读。桌面和手机均可使用；保留键盘焦点、语义标题、替代文本以及 reduced-motion 支持。
- 默认使用轻量静态 HTML/CSS/JavaScript，兼容 GitHub Pages。不要为这项展示需求引入服务器、数据库、账号系统或另一个托管平台。
- 页面样式与交互位于 `assets/css/`、`assets/js/`。修改 `content/profile.json` 后运行 `npm run content`，通过 `scripts/profile-html.mjs` 同步静态 HTML；不要手工修改生成区。简介、论文和重要链接无需浏览器 JavaScript 即可读取。
- `npm run dev` 只提供明确允许的网页文件；`npm run build` 只打包公开运行资源。添加新的运行时目录时，同时更新 `scripts/site-files.mjs`、校验和文档。

## 常用命令与完成标准

```text
npm run dev
npm run content
npm run check
npm run build
git diff --check
```

- Node.js 20+ 即可，无第三方 npm 依赖，不需要先安装包。
- 修改内容/资源后运行 `npm run check`；修改页面后再运行 `npm run build`，检查桌面和手机效果、链接、键盘操作及控制台。
- `check` 验证资料、资源和工作区一致性，不代表旧页面已经通过视觉、无障碍或运行时验收。
- 不为低风险文档编辑新增测试框架。对发布边界、身份凭据等有实际风险的实现，做针对性验证。
- 更新 `docs/PROJECT_STATUS.md`，说明做了什么、验证了什么、仍缺什么。交付时区分本地修改、Git 提交、远端推送和网站实际部署。

## GitHub 授权与发布

- 用户已授权后续页面修改直接使用其为本仓库提供的 GitHub 凭据；正常改版任务内的修改、提交和普通推送不需要重复索要同一授权。遵守用户当次要求的范围；仅准备本地工作区的任务不需要发布。
- Git remote 必须保持不含 token 的 HTTPS 地址。凭据交由 Windows Credential Manager；`scripts/Connect-GitHub.ps1` 可在本机隐藏输入后配置，`-Check` 只验证现有凭据。不要在工具输出、文件、提交、URL 或命令行参数中暴露 token。
- `private/github-access.json` 是忽略的本地权限和 Pages 配置报告，不含 token；权限或发布源未知时重新检查，不要猜测。
- 本地 `main` 跟踪 `origin/main`。普通发布前先 fetch 并检查差异，尊重已有远端变更，不 force-push，不重写历史。
- 普通页面修改权限不包括删除仓库、更改域名、扩大 token 权限或公开原始私密资料。
- 凭据失效时继续完成可以本地完成的工作，明确报告认证问题，不声称已推送或已上线。
