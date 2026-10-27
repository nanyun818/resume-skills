---
name: resume-builder
description: 制作中文简历。根据用户提供的个人经历生成 A4 简历（HTML + PDF），内置 8 套模板（经典蓝、深蓝侧栏、青色横幅、紫色时间轴、极简黑白、商务红、清新绿、活力橙），支持换模板、主题色、字体和自动压缩到一页。当用户要写简历、改简历、换简历模板、导出简历 PDF、润色简历内容时使用。
---

# 简历生成

用一份 JSON 数据驱动 8 套模板。脚本只依赖 Node.js 18+；导出 PDF 需要本机安装 Chrome 或 Edge（也可设置 `CHROME_PATH`）。

`<skill>` 指本 SKILL.md 所在目录。

## 流程

1. 收集信息。用户只给了零散描述或旧简历时，先整理出已有内容，再一次性问清缺的关键信息（求职意向、联系方式、时间段）。不要编造经历、数据或公司名；没有量化数据就如实写，不要虚构数字。
2. 写数据文件。按 [references/schema.md](references/schema.md) 写 `resume.json`，放在用户的工作目录，示例见 [assets/sample.json](assets/sample.json)。头像路径相对 JSON 文件所在目录。
3. 选模板。用户没指定时，按岗位推荐（见下表），或运行 gallery 生成全部模板的对比页让用户挑。
4. 生成：
   ```bash
   node <skill>/scripts/resume.mjs render resume.json --template classic --pdf
   ```
   默认输出到 JSON 同目录的 `output/<姓名>-简历-<模板>.html/.pdf`，`--out` 可指定路径前缀。
5. 检查。确认 PDF 只有一页（内容很多时可能多页），把文件路径告诉用户。用户要改内容、换模板或换颜色时，改 JSON 或参数后重新 render。

## 命令

```bash
node <skill>/scripts/resume.mjs list                      # 列出模板
node <skill>/scripts/resume.mjs render <json> [选项]       # 生成简历
node <skill>/scripts/resume.mjs gallery [json] --out dir   # 用同一份数据生成全部模板 + index.html 对比页
```

render 选项：`--template <id>`、`--color #hex`、`--font sans|serif|kai`、`--font-size 10-16`、`--out <路径前缀>`、`--pdf`、`--no-photo`、`--multi-page`（关闭自动压缩到一页）。命令行参数优先于 JSON 里的 `theme`。

## 模板

| ID | 名称 | 布局 | 适合 |
|---|---|---|---|
| classic | 经典蓝 | 单栏，标题下划线 | 通用、应届生 |
| sidebar | 深蓝侧栏 | 左深色侧栏双栏 | 有经验、技术岗 |
| banner | 青色横幅 | 色块头部 + 斜角标签标题 | 互联网、运营、市场 |
| timeline | 紫色时间轴 | 时间轴 | 经历连贯、突出成长路径 |
| minimal | 极简黑白 | 居中、无装饰 | 金融、法律、咨询、外企 |
| business | 商务红 | 顶部色条 + 色块标题 | 销售、管理、行政、传统行业 |
| fresh | 清新绿 | 右浅色侧栏双栏 | 教育、设计、医疗、应届生 |
| modern | 活力橙 | 头像在左、圆角标签标题 | 产品、新媒体、创意 |

## 内容建议

- 经历要点用"动作 + 结果"，有数据时把关键数字用 `**加粗**` 标出。
- 应届生：`sectionOrder` 把 education、internships、campus 放前面；社招把 work、projects 放前面，教育放后。
- 一页放不下时，先删弱相关的经历和兴趣爱好，再考虑 `--multi-page`。
- 用户要求英文简历时，用 `sectionTitles` 把模块标题改成英文。
