#!/usr/bin/env node
// 简历生成 CLI
//   node resume.mjs list                                   列出全部模板
//   node resume.mjs render <data.json> [选项]               生成 HTML（加 --pdf 同时生成 PDF）
//   node resume.mjs gallery [data.json] [--out dir] [--pdf] 用同一份数据生成所有模板，便于挑选
// 选项：--template <id> --color <#hex> --font sans|serif|kai --font-size <10-16> --out <路径前缀> --pdf --no-photo --multi-page
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderResume } from "./lib/render.mjs";
import { listTemplates } from "./lib/templates.mjs";
import { htmlToPdf } from "./lib/pdf.mjs";
import { esc } from "./lib/util.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE = path.resolve(HERE, "../assets/sample.json");

function parseArgs(argv) {
  const pos = [], opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { pos.push(a); continue; }
    const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (["pdf", "noPhoto", "multiPage"].includes(key)) opt[key] = true;
    else opt[key] = argv[++i];
  }
  return { pos, opt };
}

function readData(file) {
  const p = path.resolve(file);
  try {
    return { data: JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, "")), baseDir: path.dirname(p) };
  } catch (e) {
    throw new Error(`读取简历数据失败 ${p}: ${e.message}`);
  }
}

function write(data, baseDir, opt, outPrefix) {
  const html = renderResume(data, {
    template: opt.template, color: opt.color, font: opt.font, fontSize: opt.fontSize,
    hidePhoto: opt.noPhoto || undefined, onePage: opt.multiPage ? false : undefined, baseDir,
  });
  fs.mkdirSync(path.dirname(path.resolve(outPrefix)), { recursive: true });
  const htmlPath = outPrefix + ".html";
  fs.writeFileSync(htmlPath, html, "utf8");
  const out = { html: path.resolve(htmlPath) };
  if (opt.pdf) out.pdf = path.resolve(htmlToPdf(htmlPath, outPrefix + ".pdf"));
  return out;
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { pos, opt } = parseArgs(rest);

  if (cmd === "list") {
    console.log(JSON.stringify(listTemplates(), null, 2));
    return;
  }

  if (cmd === "render") {
    if (!pos[0]) throw new Error("用法: node resume.mjs render <data.json> [--template id] [--out 路径前缀] [--pdf]");
    const { data, baseDir } = readData(pos[0]);
    const tpl = opt.template || data.theme?.template || "classic";
    const name = (data.basics?.name || "resume").replace(/[\\/:*?"<>|\s]/g, "");
    const outPrefix = (opt.out || path.join(path.dirname(path.resolve(pos[0])), "output", `${name}-简历-${tpl}`)).replace(/\.(html|pdf)$/i, "");
    console.log(JSON.stringify(write(data, baseDir, opt, outPrefix), null, 2));
    return;
  }

  if (cmd === "gallery") {
    const { data, baseDir } = readData(pos[0] || SAMPLE);
    const dir = path.resolve(opt.out || "resume-gallery");
    const items = listTemplates().map((t) => ({ ...t, ...write(data, baseDir, { ...opt, template: t.id, color: undefined }, path.join(dir, t.id)) }));
    const index = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>简历模板一览</title><style>
body{font-family:"Microsoft YaHei","PingFang SC",sans-serif;background:#f3f4f6;margin:0;padding:24px}
h1{font-size:20px;margin:0 0 16px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
.card{background:#fff;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,.1);overflow:hidden}
.thumb{height:400px;overflow:hidden;position:relative}.thumb iframe{width:794px;height:1123px;border:0;transform:scale(.38);transform-origin:0 0;pointer-events:none}
.meta{padding:10px 14px;font-size:13px;color:#555}.meta b{font-size:15px;color:#222}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}
a{color:inherit;text-decoration:none}</style></head><body><h1>简历模板一览（${items.length} 套）</h1><div class="grid">${items
      .map((t) => `<a class="card" href="${esc(t.id)}.html" target="_blank"><div class="thumb"><iframe src="${esc(t.id)}.html" loading="lazy"></iframe></div><div class="meta"><b><span class="dot" style="background:${esc(t.color)}"></span>${esc(t.name)}</b>（${esc(t.id)}）<br>${esc(t.layout)} · 头像：${esc(t.photo)}<br>${esc(t.desc)}</div></a>`)
      .join("")}</div></body></html>`;
    fs.writeFileSync(path.join(dir, "index.html"), index, "utf8");
    console.log(JSON.stringify({ index: path.join(dir, "index.html"), templates: items.map((t) => t.id) }, null, 2));
    return;
  }

  console.log("用法:\n  node resume.mjs list\n  node resume.mjs render <data.json> [--template id] [--color #hex] [--font sans|serif|kai] [--font-size 13] [--out 路径前缀] [--pdf] [--no-photo] [--multi-page]\n  node resume.mjs gallery [data.json] [--out dir] [--pdf]");
}

try {
  main();
} catch (e) {
  console.error("错误：" + e.message);
  process.exit(1);
}
