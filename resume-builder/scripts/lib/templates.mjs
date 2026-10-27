import { esc } from "./util.mjs";
import { buildSections } from "./sections.mjs";
import { sectionHtml, contactsHtml, photoHtml, jobHtml, summaryHtml } from "./layout.mjs";

/** 侧边栏模板放到侧栏里的模块 */
const SIDE_KEYS = ["skills", "languages", "certificates", "hobbies"];

const header = (b, photo, { center = false } = {}) => `
<header class="hd${center ? " hd-center" : ""}">
  <div class="hd-info">
    <div class="name">${esc(b.name)}</div>
    ${jobHtml(b)}
    ${contactsHtml(b)}
    ${summaryHtml(b)}
  </div>
  ${photoHtml(photo)}
</header>`;

const main = (data, opts) => buildSections(data, opts).map(sectionHtml).join("");

/** 侧栏 + 主栏通用结构 */
function twoColumn(data, photo, side = "left") {
  const b = data.basics || {};
  const sideSecs = buildSections(data, { mode: "tags" }).filter((s) => SIDE_KEYS.includes(s.key));
  const aside = `<aside class="side">
    ${photoHtml(photo, "photo side-photo")}
    <div class="side-name">${esc(b.name)}</div>
    ${b.title ? `<div class="side-job">${esc(b.title)}</div>` : ""}
    <section class="section"><h2 class="section-title"><span>联系方式</span></h2>${contactsHtml(b, { vertical: true })}</section>
    ${sideSecs.map(sectionHtml).join("")}
  </aside>`;
  const content = `<main class="main">
    ${b.summary ? `<section class="section"><h2 class="section-title"><span>个人简介</span></h2>${summaryHtml(b)}</section>` : ""}
    ${main(data, { exclude: SIDE_KEYS })}
  </main>`;
  return `<div class="cols cols-${side}">${side === "left" ? aside + content : content + aside}</div>`;
}

const TWO_COL_CSS = `
.cols { display: flex; min-height: 297mm; }
.side { width: 68mm; padding: 14mm 7mm; flex-shrink: 0; }
.main { flex: 1; padding: 12mm 9mm; }
.side-photo { display: block; margin: 0 auto 10px; }
.side-name { font-size: 24px; font-weight: 700; text-align: center; letter-spacing: 2px; }
.side-job { text-align: center; margin-top: 2px; opacity: .85; }
.contacts.vertical { flex-direction: column; gap: 2px; margin-top: 0; word-break: break-all; }
.side .simple-list li { display: block; }
`;

export const TEMPLATES = {
  classic: {
    name: "经典蓝", color: "#2b6cb0", layout: "单栏", photo: "右上角",
    desc: "最通用的单栏简历，标题带下划线，适合大多数岗位和应届生。",
    render: (data, photo) => ({
      body: `<div class="wrap">${header(data.basics || {}, photo)}${main(data)}</div>`,
      css: `
.wrap { padding: 12mm 15mm; }
.hd { display: flex; gap: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--c); }
.hd-info { flex: 1; }
.section-title { border-bottom: 1px solid #dde3ea; padding-bottom: 3px; }
.section-title span { border-bottom: 2px solid var(--c); padding-bottom: 3px; }`,
    }),
  },

  sidebar: {
    name: "深蓝侧栏", color: "#2f3e56", layout: "左侧栏双栏", photo: "侧栏顶部",
    desc: "左侧深色侧栏放头像、联系方式、技能，右侧放经历，信息密度高，适合有经验的求职者。",
    render: (data, photo) => ({
      body: twoColumn(data, photo, "left"),
      css: TWO_COL_CSS + `
.side { background: var(--c); color: #e6eaf0; }
.side .photo { border: 3px solid rgba(255,255,255,.3); border-radius: 4px; }
.side .section-title { color: #fff; border-bottom: 1px solid rgba(255,255,255,.3); padding-bottom: 3px; }
.side .contacts, .side .contacts .label, .side strong { color: #e6eaf0; }
.side .tag { background: rgba(255,255,255,.15) !important; color: #fff !important; }
.side .simple-list li::before { background: #fff; }
.side .simple-level, .side .simple-date { color: #b8c2d0; }
.main .section-title { display: flex; align-items: center; gap: 8px; }
.main .section-title::before { content: ""; width: 4px; height: 16px; background: var(--c); }
.main .section-title::after { content: ""; flex: 1; height: 1px; background: #e2e6eb; }`,
    }),
  },

  banner: {
    name: "青色横幅", color: "#1a9a8a", layout: "色块头部单栏", photo: "头部右侧圆形",
    desc: "顶部整块主题色横幅，视觉冲击强，适合互联网、运营、市场类岗位。",
    render: (data, photo) => ({
      body: `${header(data.basics || {}, photo)}<div class="wrap">${main(data)}</div>`,
      css: `
.hd { display: flex; align-items: center; gap: 16px; background: var(--c); color: #fff; padding: 10mm 15mm 8mm; }
.hd-info { flex: 1; }
.hd .name, .hd .job, .hd .contacts, .hd .label, .hd .summary { color: #fff; }
.hd .label { opacity: .75; }
.hd .photo { width: 28mm; height: 28mm; border-radius: 50%; border: 3px solid rgba(255,255,255,.6); }
.wrap { padding: 4mm 15mm 10mm; }
.section-title span { display: inline-block; background: var(--c); color: #fff; padding: 1px 14px 1px 10px; clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%); }
.section-title { border-bottom: 2px solid var(--c); line-height: 1.7; }`,
    }),
  },

  timeline: {
    name: "紫色时间轴", color: "#6b4fbb", layout: "时间轴单栏", photo: "右上角",
    desc: "经历按时间轴纵向排布，时间线清晰，适合经历连贯、想突出成长路径的求职者。",
    render: (data, photo) => ({
      body: `<div class="wrap">${header(data.basics || {}, photo)}${main(data)}</div>`,
      css: `
.wrap { padding: 12mm 15mm; }
.hd { display: flex; gap: 16px; padding-bottom: 10px; }
.hd-info { flex: 1; }
.hd .photo { border-radius: 6px; }
.section-title { display: flex; align-items: center; gap: 8px; }
.section-title::before { content: ""; width: 14px; height: 14px; border-radius: 50%; border: 3px solid var(--c); background: #fff; }
.section-body { margin-left: 8px; padding-left: 18px; border-left: 2px solid var(--c-soft); }
.entry { position: relative; }
.entry::before { content: ""; position: absolute; left: -23px; top: .55em; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
.entry-head { flex-wrap: wrap; }
.entry-date { color: var(--c); font-weight: 600; }`,
    }),
  },

  minimal: {
    name: "极简黑白", color: "#333333", layout: "居中单栏", photo: "无（可选）",
    desc: "黑白极简，居中排版，无多余装饰，适合金融、法律、咨询、外企等正式场景。",
    render: (data, photo) => ({
      body: `<div class="wrap">${header(data.basics || {}, photo, { center: true })}${main(data)}</div>`,
      css: `
.wrap { padding: 12mm 16mm; }
.hd-center { display: flex; flex-direction: column-reverse; align-items: center; text-align: center; padding-bottom: 8px; border-bottom: 1px solid #333; }
.hd-center .photo { width: 22mm; height: 29mm; margin-bottom: 6px; }
.hd-center .contacts { justify-content: center; }
.name { font-size: 28px; letter-spacing: 6px; }
.job { color: #555; }
.section-title { color: #222; text-transform: uppercase; letter-spacing: 3px; border-bottom: 1px solid #bbb; padding-bottom: 2px; font-size: 14px; }
.entry-list li::before, .simple-list li::before { background: #333; }
.skill-group .tag { background: #f0f0f0; color: #333; }`,
    }),
  },

  business: {
    name: "商务红", color: "#b33a3a", layout: "单栏色条标题", photo: "右上角",
    desc: "标题使用整行浅色底条，稳重大气，适合销售、管理、行政、传统行业岗位。",
    render: (data, photo) => ({
      body: `<div class="topbar"></div><div class="wrap">${header(data.basics || {}, photo)}${main(data)}</div>`,
      css: `
.topbar { height: 8px; background: var(--c); }
.wrap { padding: 9mm 15mm 12mm; }
.hd { display: flex; gap: 16px; padding-bottom: 6px; }
.hd-info { flex: 1; }
.hd .photo { border: 1px solid #ddd; padding: 2px; }
.section-title { background: var(--c-soft); border-left: 5px solid var(--c); padding: 2px 10px; }`,
    }),
  },

  fresh: {
    name: "清新绿", color: "#3c9d5d", layout: "右侧栏双栏", photo: "侧栏顶部圆形",
    desc: "浅色右侧栏，配色柔和清新，适合教育、设计、医疗、应届生等岗位。",
    render: (data, photo) => ({
      body: twoColumn(data, photo, "right"),
      css: TWO_COL_CSS + `
.side { background: var(--c-soft); }
.side .photo { width: 30mm; height: 30mm; border-radius: 50%; border: 3px solid #fff; }
.side-name { color: var(--c); }
.side .section-title { text-align: center; }
.side .section-title span { border-bottom: 2px solid var(--c); padding: 0 6px 2px; }
.side .tag { background: #fff !important; }
.main .section-title { border-bottom: 2px dashed var(--c); padding-bottom: 2px; }`,
    }),
  },

  modern: {
    name: "活力橙", color: "#e07b39", layout: "单栏圆角标签", photo: "左上角圆角",
    desc: "头像在左、圆角标签式标题，现代活泼，适合互联网产品、新媒体、创意类岗位。",
    render: (data, photo) => {
      const b = data.basics || {};
      return {
        body: `<div class="wrap"><header class="hd">${photoHtml(photo)}<div class="hd-info"><div class="name">${esc(b.name)}</div>${jobHtml(b)}${contactsHtml(b)}${summaryHtml(b)}</div></header>${main(data)}</div>`,
        css: `
.wrap { padding: 12mm 15mm; }
.hd { display: flex; gap: 18px; align-items: center; padding: 10px 14px; background: var(--c-soft); border-radius: 10px; }
.hd-info { flex: 1; }
.hd .photo { border-radius: 10px; }
.section-title { display: flex; align-items: center; gap: 10px; }
.section-title span { background: var(--c); color: #fff; padding: 0 14px; border-radius: 12px; font-size: 14px; }
.section-title::after { content: ""; flex: 1; height: 2px; background: var(--c-soft); }`,
      };
    },
  },
};

export function listTemplates() {
  return Object.entries(TEMPLATES).map(([id, t]) => ({ id, name: t.name, color: t.color, layout: t.layout, photo: t.photo, desc: t.desc }));
}
