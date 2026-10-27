import { esc, inline } from "./util.mjs";
import { contacts } from "./sections.mjs";

/** 所有模板共享的基础样式；模板 CSS 在其后覆盖 */
export const BASE_CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #e9ecef; }
body {
  font-family: var(--font);
  color: #333; font-size: var(--fs); line-height: var(--lh, 1.55);
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.measuring .page, .measuring .cols { min-height: 0 !important; }
.page { width: 210mm; min-height: 297mm; margin: 12px auto; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.12); overflow: hidden; }
@media print {
  html, body { background: #fff; }
  .page { margin: 0; box-shadow: none; }
  .entry, .simple-list li { break-inside: avoid; }
  .section-title { break-after: avoid; }
}
ul { list-style: none; }
strong { font-weight: 600; color: #222; }
.photo { width: 26mm; height: 34mm; object-fit: cover; flex-shrink: 0; }
.name { font-size: 26px; font-weight: 700; color: #222; letter-spacing: 2px; }
.job { font-size: 14px; color: var(--c); margin-top: 2px; }
.contacts { display: flex; flex-wrap: wrap; gap: 2px 16px; margin-top: 6px; color: #555; }
.contacts .label { color: #999; margin-right: 2px; }
.summary { margin-top: 6px; color: #555; }
.section { margin-top: 10px; }
.section-title { font-size: 15px; font-weight: 700; color: var(--c); margin-bottom: 5px; }
.entry { margin-bottom: 6px; }
.entry-head { display: flex; align-items: baseline; gap: 12px; }
.entry-title { font-weight: 700; color: #222; }
.entry-sub { color: #555; }
.entry-date { margin-left: auto; color: #888; white-space: nowrap; font-size: .95em; }
.entry-extra { color: #777; font-size: .95em; }
.entry-desc { color: #444; }
.entry-list li, .simple-list li { position: relative; padding-left: 12px; }
.entry-list li::before, .simple-list li::before { content: ""; position: absolute; left: 2px; top: .7em; width: 4px; height: 4px; border-radius: 50%; background: var(--c); }
.simple-list li { display: flex; gap: 10px; }
.simple-name { flex: 1; }
.simple-date { color: #888; white-space: nowrap; }
.simple-level { white-space: nowrap; }
.text { color: #444; text-align: justify; }
.text + .text { margin-top: 4px; }
.skill-group .tag { display: inline-block; padding: 0 8px; margin: 0 4px 4px 0; border-radius: 3px; background: var(--c-soft); color: var(--c); font-size: .92em; }
.inline-list { display: flex; flex-wrap: wrap; gap: 2px 0; color: #444; }
.inline-list span:not(:last-child)::after { content: "·"; margin: 0 10px; color: #bbb; }
.inline-list em, .simple-level { font-style: normal; color: #888; margin-left: 6px; }
`;

export function sectionHtml(s) {
  return `<section class="section section-${esc(s.key)}"><h2 class="section-title"><span>${esc(s.title)}</span></h2><div class="section-body">${s.body}</div></section>`;
}

export function contactsHtml(b, { labels = true, vertical = false } = {}) {
  const list = contacts(b);
  if (!list.length) return "";
  return `<div class="contacts${vertical ? " vertical" : ""}">${list
    .map((c) => `<span class="contact contact-${c.k}">${labels ? `<span class="label">${c.label}：</span>` : ""}${esc(c.v)}</span>`)
    .join("")}</div>`;
}

export function photoHtml(photo, cls = "photo") {
  return photo ? `<img class="${cls}" src="${esc(photo)}" alt="照片">` : "";
}

export function jobHtml(b) {
  const t = [b.title, b.salary, b.jobCity].filter(Boolean).join(" | ");
  return t ? `<div class="job">求职意向：${esc(t)}</div>` : "";
}

export function summaryHtml(b) {
  return b.summary ? `<p class="summary">${inline(b.summary)}</p>` : "";
}

/** 生成完整 HTML 文档 */
export function documentHtml({ title, vars, css, body, tpl, onePage = true }) {
  const varCss = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";");
  // 一页适配：内容略超 A4 时逐步缩小字号/行距（下限 11px），仍超出则保持分页
  const fit = onePage ? `<script>(function(){
  var root=document.documentElement, page=document.querySelector('.page');
  var mm=document.createElement('div'); mm.style.height='297mm'; document.body.appendChild(mm);
  var limit=mm.getBoundingClientRect().height; mm.remove();
  function h(){ root.classList.add('measuring'); var v=page.scrollHeight; root.classList.remove('measuring'); return v; }
  var fs=parseFloat(getComputedStyle(root).getPropertyValue('--fs'))||13, lh=1.55;
  while(h()>limit && fs>11){ fs-=0.25; lh=Math.max(1.4,lh-0.02); root.style.setProperty('--fs',fs+'px'); root.style.setProperty('--lh',lh); }
})();</script>` : "";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>:root{${varCss}}${BASE_CSS}${css}</style>
</head>
<body class="tpl-${esc(tpl)}">
<div class="page">${body}</div>${fit}
</body>
</html>`;
}
