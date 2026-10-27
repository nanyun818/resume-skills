import { esc, inline, range, arr } from "./util.mjs";

export const DEFAULT_TITLES = {
  education: "教育背景",
  work: "工作经历",
  internships: "实习经历",
  projects: "项目经历",
  campus: "校园经历",
  skills: "专业技能",
  awards: "荣誉奖项",
  certificates: "证书资质",
  languages: "语言能力",
  hobbies: "兴趣爱好",
  selfEvaluation: "自我评价",
};

export const DEFAULT_ORDER = [
  "education", "work", "internships", "projects", "campus",
  "skills", "awards", "certificates", "languages", "hobbies", "selfEvaluation",
];

/** 经历类模块的字段映射：title / subtitle 取哪些字段 */
const EXP_FIELDS = {
  education: (i) => ({ title: i.school, subtitle: [i.major, i.degree].filter(Boolean).join(" | "), extra: i.gpa ? `GPA：${i.gpa}` : "" }),
  work: (i) => ({ title: i.company, subtitle: i.position }),
  internships: (i) => ({ title: i.company, subtitle: i.position }),
  projects: (i) => ({ title: i.name, subtitle: i.role }),
  campus: (i) => ({ title: i.organization || i.org, subtitle: i.role }),
};

function entry(item, key) {
  const map = (EXP_FIELDS[key] || (() => ({})))(item);
  const title = map.title || item.title || "";
  const subtitle = map.subtitle || item.subtitle || "";
  const extra = [map.extra, item.location].filter(Boolean).join(" · ");
  const desc = item.description ? `<p class="entry-desc">${inline(item.description)}</p>` : "";
  const hl = arr(item.highlights);
  const list = hl.length ? `<ul class="entry-list">${hl.map((h) => `<li>${inline(h)}</li>`).join("")}</ul>` : "";
  return `<div class="entry">
  <div class="entry-head">
    <span class="entry-title">${esc(title)}</span>
    ${subtitle ? `<span class="entry-sub">${esc(subtitle)}</span>` : ""}
    <span class="entry-date">${range(item.start, item.end)}</span>
  </div>
  ${extra ? `<div class="entry-extra">${esc(extra)}</div>` : ""}${desc}${list}
</div>`;
}

function simpleItems(items) {
  return `<ul class="simple-list">${arr(items)
    .map((i) => {
      if (typeof i === "string") return `<li>${inline(i)}</li>`;
      const date = i.date ? `<span class="simple-date">${esc(i.date)}</span>` : "";
      const level = i.level ? `<span class="simple-level">${esc(i.level)}</span>` : "";
      return `<li><span class="simple-name">${inline(i.name)}</span>${level}${date}</li>`;
    })
    .join("")}</ul>`;
}

/** 行内排布：A（等级） · B · C */
function inlineItems(items) {
  return `<div class="inline-list">${arr(items)
    .map((i) => (typeof i === "string" ? `<span>${inline(i)}</span>` : `<span>${inline(i.name)}${i.level ? `<em>${esc(i.level)}</em>` : ""}</span>`))
    .join("")}</div>`;
}

/** 技能：纯列表，"名称（文字等级）：关键词"；数字等级不显示 */
function skills(items) {
  return `<ul class="simple-list skill-list">${arr(items)
    .map((s) => {
      if (typeof s === "string") return `<li>${inline(s)}</li>`;
      const lv = s.level && !Number.isFinite(Number(s.level)) ? `（${esc(s.level)}）` : "";
      const kws = arr(s.keywords).length ? `：${arr(s.keywords).map(esc).join("、")}` : "";
      return `<li><span><strong>${inline(s.name)}</strong>${lv}${kws}</span></li>`;
    })
    .join("")}</ul>`;
}

function textBlock(v) {
  return arr(v).map((p) => `<p class="text">${inline(p)}</p>`).join("");
}

/** 渲染单个模块内容（不含标题），返回空串表示无内容 */
export function sectionBody(key, data, mode) {
  const v = data[key];
  if (v === undefined || v === null || (Array.isArray(v) && !v.length) || v === "") return "";
  if (EXP_FIELDS[key]) return arr(v).map((i) => entry(i, key)).join("");
  if (key === "skills") return skills(v);
  if (key === "selfEvaluation") return textBlock(v);
  if (key === "hobbies" && mode === "tags") return `<div class="skill-group">${arr(v).map((h) => `<span class="tag">${esc(typeof h === "string" ? h : h.name)}</span>`).join("")}</div>`;
  if (["certificates", "languages", "hobbies"].includes(key) && mode !== "tags") return inlineItems(v);
  return simpleItems(v);
}

/** 自定义模块：data.custom = [{ title, items | content }] */
export function customSections(data, mode) {
  return arr(data.custom).map((c) => {
    const body = c.content ? textBlock(c.content)
      : arr(c.items).some((i) => i && typeof i === "object" && (i.title || i.start))
        ? arr(c.items).map((i) => entry(i, "custom")).join("")
        : simpleItems(c.items);
    return { key: "custom", title: c.title, body, mode };
  });
}

export function titleOf(key, data) {
  return (data.sectionTitles && data.sectionTitles[key]) || DEFAULT_TITLES[key] || key;
}

/** 按顺序生成模块列表；exclude 中的模块交给侧边栏 */
export function buildSections(data, { exclude = [], mode = "list" } = {}) {
  const order = arr(data.sectionOrder).length ? data.sectionOrder : DEFAULT_ORDER;
  const out = [];
  for (const key of order) {
    if (exclude.includes(key)) continue;
    if (key === "custom") { out.push(...customSections(data, mode)); continue; }
    const body = sectionBody(key, data, mode);
    if (body) out.push({ key, title: titleOf(key, data), body });
  }
  if (!order.includes("custom")) out.push(...customSections(data, mode));
  return out;
}

/** 联系方式条目 */
export function contacts(b) {
  const items = [
    ["phone", "电话", b.phone], ["email", "邮箱", b.email], ["city", "城市", b.city],
    ["age", "年龄", b.age], ["gender", "性别", b.gender], ["status", "状态", b.status],
    ["website", "主页", b.website], ["wechat", "微信", b.wechat],
  ];
  return items.filter(([, , v]) => v !== undefined && v !== null && v !== "").map(([k, label, v]) => ({ k, label, v: String(v) }));
}
