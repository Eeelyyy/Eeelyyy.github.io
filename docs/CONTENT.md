# 内容来源与编辑说明

## 数据来源

用户于 2026-11-16 提供了一段英文 LaTeX CV。完整原文保存于 `private/cv-original.tex`，该目录被 Git 忽略。`content/profile.json` 是适合网站开发和 Git 版本管理的转录版本。

原 CV 含手机号，结构化公开数据不包含它。Gmail 和 Scholar 链接按用户提供的 CV 采用；GitHub 链接来自用户指定仓库。不要从旧 `index.html` 把学校邮箱重新覆盖回来。

数据中的 `source.asOf` 表示资料对应的时间，不会自动更新。`Present`、当前实习以及未来入学信息，都需要以后随新 CV 核对。

## 字段与网页位置

| 数据字段 | 推荐呈现 |
| --- | --- |
| `person` | 姓名、学位与实习身份、简介、研究兴趣、联系链接 |
| `publications` | Selected publications；同时展示清楚的录用/投稿状态 |
| `research` | 与论文按 ID 关联，展开 Project details 可查看项目主题、机构、日期与方法 |
| `internships` | Experience；与研究项目日期分开展示 |
| `education` | Education；未来入学保留 Expected 日期 |
| `interests`、`otherExperience` | 放在简短的 Outside research 一节 |
| `news` | 当前为空；不根据年份臆造新闻日期 |

`person.bio` 是根据 CV 整理的简短英文简介；`bioNote`、`source` 和 `evaluationContext.note` 是编辑元数据，不要机械显示给网站访客。网页不必逐字展示全部 CV 条目，但不能改变事实。

## 容易误写的内容

- 姓名按 CV 使用 **Yishen Liu**；用户没有提供中文姓名，不推断中文汉字。
- 目前为 BIT **Vehicle Engineering M.Eng.**，不是计算机科学硕士。
- HIT (Shenzhen) 的 **Incoming Ph.D. in Computer Vision** 为 **Sep. 2027 (Expected)**，不能写成当前在读。
- GroundingAnomaly 的录用状态来自 CV：**Accepted to ECCV 2026**；链接为原文提供的 arXiv 和 GitHub。当前没有额外验证这些外部链接与录用事实。
- FlowSteer 为 **Submitted to CVPR 2027 / under review**，无公开论文或代码链接。不能改成 accepted/published。
- FlowSteer 研究经历：**Nov. 2025 – May 2026**。Meitu 实习：**Feb. 2026 – May 2026**。原文确实使用不同日期，保留两者。
- FlowSteer 数字为 GenEval **0.97**、OCR **0.96**、PickScore **23.91**，模型为 **SD3.5-Medium**，原文计算量为 **1/3 GPU hour**。没有 GPU 型号、采样数量等信息，不补写推断。
- Li Auto 项目中“传统方法所需数据的 **10%**”不代表“准确率提高 90%”。两项专利是 **applications under review**，不是已授权专利。
- 作者名单仅有 **Yishen Liu et al.**，不要生成合作者姓名或 BibTeX 条目。

## 尚未提供的素材

- 完整 CV PDF：原始 LaTeX 只有正文片段，依赖未提供的文档类、宏和图标。当前 `cvPdf: null`，不做失效下载按钮。
- 真实头像、论文图、完整作者表、FlowSteer 公开链接均未提供。缺失字段保留 `null`。
- `figs/` 是网站艺术参考素材，不是实验配图或个人照片。

## 更新流程

1. 接到新 CV 时保留原文于 `private/`，更新 `profile.json` 的相关条目和 `source` 日期。
2. 保持现有稳定 ID，检查论文与研究项目的关联；日期字段使用 `YYYY-MM`，显示用 `dateLabel`。
3. 运行 `npm run content`，由 `scripts/profile-html.mjs` 把公开资料写入 `index.html` 的 `profile:*` 标记区。姓名、两行身份与三个联系入口位于首页左栏；完整简介和研究兴趣位于 About me；论文状态和资源、履历与教育、兴趣和联系信息由相应标记区生成。修改展示方式时编辑生成器；修改事实时编辑 JSON。网页无需浏览器脚本或 JSON 请求即可读取这些资料。
4. 运行 `npm run check`。缺少公开链接时隐藏按钮，不生成占位 URL。

研究项目日期在论文的“Project details”原生展开区显示；不同实习日期仍在 Experience 中单独显示。完整实验条件缺失时不展示性能数字，不生成不存在的 CV PDF 下载或论文配图。`check` 与 `build` 会拒绝 JSON 和静态 HTML 不一致的版本。
