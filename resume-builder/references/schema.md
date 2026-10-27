# 简历数据格式（JSON）

除 `basics.name` 外所有字段都可省略；空模块不渲染。正文字段支持 `**加粗**`。
日期用 `YYYY.MM` 字符串；`end` 留空表示"至今"。

## basics 基本信息

| 字段 | 说明 |
|---|---|
| name | 姓名（必填） |
| title / salary / jobCity | 求职意向：岗位 / 期望薪资 / 期望城市 |
| phone, email, city, age, gender, status, website, wechat | 联系方式与个人信息，有值才显示 |
| photo | 头像：本地路径（相对 JSON 文件所在目录）、绝对路径或 URL；支持 png/jpg/webp/gif/svg |
| summary | 一句话个人简介 |

## 经历类模块（数组）

| 模块 | 标题字段 | 副标题字段 | 其它 |
|---|---|---|---|
| education 教育背景 | school | major, degree | gpa |
| work 工作经历 | company | position | location |
| internships 实习经历 | company | position | location |
| projects 项目经历 | name | role | |
| campus 校园经历 | organization | role | |

通用字段：`start`、`end`、`description`（一段话）、`highlights`（字符串数组，渲染为要点列表）。

## 其它模块

- `skills` 专业技能：字符串数组，或 `{ name, level, keywords }`。以纯列表展示为"名称（等级）：关键词"；`level` 仅文字（如"精通"）会显示，数字会被忽略。
- `awards` 荣誉奖项：字符串或 `{ name, date }`
- `certificates` 证书：字符串或 `{ name, date }`
- `languages` 语言能力：字符串或 `{ name, level }`
- `hobbies` 兴趣爱好：字符串数组
- `selfEvaluation` 自我评价：字符串或字符串数组（多段）
- `custom` 自定义模块：`[{ title, items }]` 或 `[{ title, content }]`；items 可以是字符串，也可以是带 title/start/end/highlights 的经历对象

## 排版控制

- `sectionOrder`：模块顺序，如 `["education","internships","campus","skills","awards","selfEvaluation"]`；不在列表里的模块不显示。可包含 `"custom"` 指定自定义模块的位置
- `sectionTitles`：改模块标题，如 `{ "work": "工作经验" }`
- `theme`：`{ template, color, font, fontSize, onePage, hidePhoto }`
  - template：classic / sidebar / banner / timeline / minimal / business / fresh / modern
  - color：`#RRGGBB`，覆盖模板主色
  - font：sans（黑体，默认）/ serif（宋体）/ kai（楷体）
  - fontSize：10-16，默认 13
  - onePage：默认 true，内容略超 A4 时自动缩小字号（下限 11px）压到一页
- 双栏模板（sidebar、fresh）会把 skills、languages、certificates、hobbies 放进侧栏
