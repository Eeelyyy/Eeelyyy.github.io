# 项目状态

更新日期：2026-11-20（Asia/Shanghai）。

## 2026-11-20 互动拼贴

- 首屏左侧从四幅原画中取四条斜切片。横向拖动可控制进度、反向预览或退回；点缩略图和方向键也能拼合下一幅画。姓名末词沿用选中图的纹理。
- 右侧从清理过的街景取八条斑马线，随奶龙的位移分别错开，回位后恢复一张完整底图。点伞时出现两层取自同一张红伞 PNG 的短暂残影。
- 页尾将墙边奶龙的剪影与红色海岸和青色光环对齐。原生滑块支持鼠标、触控、方向键以及 Home / End；禁用 JavaScript 时可看完整拼贴。
- 已检查桌面与手机首屏、反向拖动、快速切换、手势取消、竖向滚动、减少动态效果、离屏清理和回位。移动端测试使用 Chrome 触屏模拟。个人 GitHub、论文及代码链接返回 200；Google Scholar 对此次自动访问返回 429，页面链接沿用 CV。
- 本地 35 项回归检查通过，另已验证切片、光影接缝的鼠标与触控对照及键盘端点。已目视检查桌面与手机的首屏和页尾。`npm run check`、`npm run build`、脚本语法与 `git diff --check` 通过，构建包含 28 个公开文件。
- 页面实现提交 `6700ca3` 已普通推送至 `origin/main` 并成功部署。正式域名通过 35 项回归及三组新增交互复测，覆盖切片反向拖动、伞与道路分层、模拟触屏取消、暂停状态及页尾接缝。[GitHub Pages 部署记录](https://github.com/Eeelyyy/Eeelyyy.github.io/actions/runs/44719219525)

## 2026-11-20 原画分层改版

- 依据用户反馈移除了自绘 SVG 奶龙和旧 favicon。现用红伞过街原画中的身体、伞面与修补后的路面构成互动场景，标签页图标也取自原伞。五张原 PNG 的哈希均与 manifest 一致。
- 首屏采用两侧斜切画幅与居中的个人资料，手机将画幅并列放在姓名下方。版式参考 [Shihao Wang 的主页](https://exiawsh.github.io/)。左侧四幅原画支持缩略图选择、键盘切换和拖动显影。右侧支持拖动角色、松手回位、轻点摇伞与雨纹反馈。
- 论文与研究经历由原有公开 JSON 生成。移除了宣传语与重复编号，保留论文状态、研究与实习的不同日期、未来入学时间和公开联系链接。
- 本地浏览器核对了桌面和手机首屏。35 项检查覆盖鼠标、模拟触屏、键盘、静止停帧、系统与手动减少动画、禁用 JavaScript、锚点目标、图片加载和 320–1920 px 所选宽度的布局。模拟触屏在 Chrome 中完成。
- 页面提交 `d4fd502` 已普通推送到 `origin/main`。现有 GitHub Pages 从该提交构建并部署成功。[构建与部署记录](https://github.com/Eeelyyy/Eeelyyy.github.io/actions/runs/44709943126)
- 实际访问 [线上首页](https://eeelyyy.github.io/) 返回 200，页面包含分层素材。首次复验时 `plates.js` 收到临时 HTTP 503，随后其原始 URL 返回 200，重新加载官网并完成全部 35 项检查。最终一轮无网络或控制台错误。

## 2026-11-18 改版

- 已替换旧页面，实现英文奶龙 × EVA 极简研究主页；已提交、推送并在 [eeelyyy.github.io](https://eeelyyy.github.io/) 上线。
- 首屏红伞过街，三幅场景可切换；奶龙支持拖拽、弹性归位、眼睛跟随、点击 AT 力场和粒子。触屏、方向键、Enter / Space、Escape 均有对应操作。
- 研究论文、项目详情、实习、教育、兴趣和联系信息由公开 JSON 生成到静态 HTML。保留 Incoming Ph.D. 的 Sep. 2027 (Expected)、ECCV Accepted、CVPR Submitted / Under review 以及研究/实习不同日期。
- 未生成缺失的 CV PDF、头像、完整作者名单或论文图片；未新增学术事实。论文状态按用户 CV 保留，未独立核验。
- 已拆分 CSS / JavaScript；九个 WebP 衍生资源约 908 KB，原始五图哈希不变。没有第三方运行依赖。
- `npm run content` 同步资料；`check`、`build` 拒绝内容漂移，并检查锚点、srcset 与 Pages 发布边界。
- `_config.yml` 使现有 Pages 根目录发布排除文档、原图和开发脚本。域名、发布分支和托管平台保持原配置。

### 验收与发布记录

- `npm run check`、`npm run build`、JavaScript 语法检查通过。
- Chrome 浏览器 32 项检查通过：1440 px 桌面、390 px 触屏模拟、320 / 768 / 1024 / 1920 px 无横向溢出；鼠标与触摸拖拽/回弹/点击、键盘方向键/Enter/Escape、场景切换、详情展开关闭、动画设置持久化、系统 reduced-motion、禁用 JavaScript 后资料和联系仍可访问。控制台和运行时错误为 0。
- 已查看桌面完整页面、手机首屏和互动截图；调整了被奶龙遮挡的场景编号。未做真实手机 Safari 设备验收。
- 四个 CV 外链（arXiv、论文代码、个人 GitHub、Google Scholar）HTTP HEAD 均返回 200；这仅验证链接可访问，不等于学术事实核验。
- 完整临时检查记录与截图保存在本机忽略目录 `artifacts/`，不提交。
- 额外 14 项定向检查通过：跳转正文链接、实际 Tab 焦点、图片横向拖动、静止时动画循环完全停止，以及私有/工作文件 HTTP 404 和非 GET/HEAD 方法拒绝。
- 已 fetch：远端没有新增冲突；现有凭据写权限及 Pages main 根目录配置已重新确认。
- 页面实现提交：`152710a0164b4d95ad60c5d7a263f8f0802183ee`，已正常推送到 `origin/main`，没有重写历史。
- GitHub Pages API 报告该提交 `built`；[构建与部署记录](https://github.com/Eeelyyy/Eeelyyy.github.io/actions/runs/44278938575) 为 `completed / success`；对应 GitHub Pages deployment 为 `success`。
- 线上首页 HTTP 200，浏览器实际读取新姓名、页面和奶龙点击效果。首页 HTML、CSS、JS、三张代表图片、公开 JSON、favicon 与本地资源哈希一致（文本按 Git LF 换行归一化）。线上控制台和运行时错误为 0。
- `private/cv-original.tex`、`private/github-access.json`、`docs/CONTENT.md`、`figs/manifest.json`、`scripts/Connect-GitHub.ps1`、`AGENTS.md`、`package.json` 均核对为 404。后两项中的脚本与 AGENTS 请求初遇 CDN 503，分别重试及使用无缓存查询参数后得到 GitHub 404；没有将 503 当作排除成功。
- 本次状态记录随后的提交只更新本文档，不改变已验收的网页资源。

## 以下为 2026-11-16 准备阶段历史

以下“当前基线 / 已准备”等表述仅指准备阶段，不代表现版本尚未改版。

## 当前基线

- 来源仓库：`Eeelyyy/Eeelyyy.github.io`。
- 拉取时的 `origin/main`：`4fca214044d1d36383bc2ff63fb6614c023114c8`。
- 仓库原来只有 `index.html`；当前工作区保留了完整 Git 历史与原网页。
- 本轮任务是整理工作区与 Codex 指南，准备文件保存为本地提交；尚未执行视觉改版或推送上线。

## 已准备

- `AGENTS.md`：项目目标、读取顺序、资料真实性、视觉规范、验证和授权约定。
- `content/profile.json`：CV 中的教育、实习、论文、研究经历、技能和兴趣。
- `private/cv-original.tex`：原始 CV 片段，Git 忽略。
- `figs/manifest.json`：五张原图的尺寸、哈希与参考用途；原图未修改。
- `docs/`：内容说明、视觉方向、开发/发布和当前状态。
- 无第三方依赖的本地预览、校验与公开资源构建命令。
- 已验证 `Eeelyyy` 对目标仓库有写权限；凭据保存于 Windows Credential Manager。安全摘要在本机 `private/github-access.json`，token 不在项目文件中。
- 已读取 Pages 配置：`build_type: legacy`，来源 `main` 分支根目录，网站为 `https://eeelyyy.github.io/`。本轮没有修改这些设置。

## 原网页已知问题

这些问题来自基线源代码检查，本轮为了保留原始页面没有直接修复：

- 页面脚本尝试设置不存在的 `#year` 元素，会造成空元素属性访问错误。
- `<section class="card">` 未正确闭合，`aside` 位置依赖浏览器的错误恢复。
- 标题颜色引用卡片背景变量，浅色主题下可读性不足。
- 页面显示旧的姓名顺序和学校邮箱，尚未读取新的 `content/profile.json`。
- 旧版背景渐变、卡片布局和主题按钮不代表新设计要求。

## 下一步改版

1. 阅读 `AGENTS.md`、CV 数据与设计文档，查看原图。
2. 按资料实现英文研究主页，优先完成简介、论文、研究项目、经历与联系入口。
3. 选定主视觉，制作实际网页尺寸的图片资源；保持原始图片可追溯。
4. 接入可维护的数据或生成流程，修复旧页面语义与脚本问题，完成移动端适配。
5. 验证后按用户当次要求提供预览或发布，并更新本文件。

## 验证记录

- `npm run check` 通过：CV 数据、跨条目关联、五张原图的尺寸/哈希、公开资源和可提交文件均已检查。
- `npm run build` 通过：当前仅输出 `index.html` 与 `content/profile.json`，没有原始 CV、认证报告、文档或工具脚本。
- 开发脚本通过 Node 语法检查；`Connect-GitHub.ps1 -Check` 从系统凭据管理器取回凭据并再次验证写权限成功。
- 临时 HTTP 检查通过：首页和公开 JSON 返回 200；HEAD 请求正常；`private/`、`.git/config`、`AGENTS.md`、认证脚本和编码路径穿越请求返回 404；POST 返回 405。验证用服务器已停止。
- 原始 CV 与用户附件逐字节保持一致；五张原图保持原始哈希；`index.html` 与远端基线保持一致。
- `git diff --check` 通过。本轮没有进行浏览器视觉验收，也没有验证论文的外部学术事实。

这些结果只覆盖本次工作区准备。原网页的已知脚本和排版问题仍需在实际改版时修复。
