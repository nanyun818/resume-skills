#!/usr/bin/env node
// 简历生成 MCP 服务（stdio）。渲染逻辑复用 ../resume-builder/scripts/lib
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { renderResume } from "../resume-builder/scripts/lib/render.mjs";
import { listTemplates, TEMPLATES } from "../resume-builder/scripts/lib/templates.mjs";
import { htmlToPdf } from "../resume-builder/scripts/lib/pdf.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(HERE, "../resume-builder");
const OUT_DIR = path.resolve(process.env.RESUME_OUTPUT_DIR || path.join(process.cwd(), "resume-output"));

const text = (t) => ({ content: [{ type: "text", text: typeof t === "string" ? t : JSON.stringify(t, null, 2) }] });
const fail = (e) => ({ isError: true, content: [{ type: "text", text: `错误：${e.message || e}` }] });

const themeShape = {
  template: z.enum(Object.keys(TEMPLATES)).optional().describe("模板 ID，见 list_templates；默认 classic"),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional().describe("主题色，如 #2b6cb0；默认用模板自带颜色"),
  font: z.enum(["sans", "serif", "kai"]).optional().describe("字体：sans 黑体 / serif 宋体 / kai 楷体"),
  fontSize: z.number().min(10).max(16).optional().describe("基础字号 px，默认 13"),
  onePage: z.boolean().optional().describe("内容略超一页时自动缩小字号压到一页，默认 true"),
  hidePhoto: z.boolean().optional().describe("不显示头像"),
};

function safeName(s) {
  return String(s || "resume").replace(/[\\/:*?"<>|\s]/g, "").slice(0, 40) || "resume";
}

/** 输出路径限制在 OUT_DIR 内，防止写到任意位置 */
function resolveOut(fileName) {
  const p = path.resolve(OUT_DIR, fileName);
  if (!p.startsWith(OUT_DIR + path.sep)) throw new Error("文件名不合法");
  fs.mkdirSync(path.dirname(p), { recursive: true });
  return p;
}

const server = new McpServer({ name: "resume-mcp", version: "1.0.0" });

server.registerTool("list_templates", {
  title: "列出简历模板",
  description: "返回全部简历模板（ID、名称、主色、布局、头像位置、适用场景），用于帮用户挑选模板。",
  inputSchema: {},
}, async () => text(listTemplates()));

server.registerTool("get_resume_schema", {
  title: "简历数据格式",
  description: "返回简历 JSON 数据结构说明和一份完整示例。调用 render_resume 前先读一次。",
  inputSchema: {},
}, async () => {
  const schema = fs.readFileSync(path.join(SKILL, "references/schema.md"), "utf8");
  const sample = fs.readFileSync(path.join(SKILL, "assets/sample.json"), "utf8");
  return text(`${schema}\n\n## 完整示例\n\n\`\`\`json\n${sample}\n\`\`\``);
});

server.registerTool("render_resume", {
  title: "生成简历",
  description: `把简历 JSON 渲染成 A4 简历，输出 HTML（可选 PDF）到 ${OUT_DIR}。返回文件路径。`,
  inputSchema: {
    data: z.record(z.any()).describe("简历数据，结构见 get_resume_schema；basics.photo 可填本地图片绝对路径或 URL"),
    ...themeShape,
    fileName: z.string().optional().describe("输出文件名（不含扩展名），默认 <姓名>-简历-<模板>"),
    pdf: z.boolean().optional().describe("是否同时生成 PDF（需要本机安装 Chrome 或 Edge），默认 true"),
  },
}, async ({ data, fileName, pdf = true, ...theme }) => {
  try {
    const tpl = theme.template || data.theme?.template || "classic";
    const base = resolveOut(safeName(fileName || `${data.basics?.name || "resume"}-简历-${tpl}`));
    const html = renderResume(data, { ...theme, template: tpl, baseDir: OUT_DIR });
    fs.writeFileSync(base + ".html", html, "utf8");
    const out = { template: tpl, html: base + ".html" };
    if (pdf) {
      try { out.pdf = htmlToPdf(base + ".html", base + ".pdf"); }
      catch (e) { out.pdfError = e.message; }
    }
    return text(out);
  } catch (e) {
    return fail(e);
  }
});

server.registerTool("render_gallery", {
  title: "生成模板对比页",
  description: "用同一份简历数据渲染全部模板，并生成 index.html 缩略图对比页，方便用户挑选。不传 data 时使用示例数据。",
  inputSchema: {
    data: z.record(z.any()).optional().describe("简历数据；省略则用内置示例"),
  },
}, async ({ data }) => {
  try {
    const d = data || JSON.parse(fs.readFileSync(path.join(SKILL, "assets/sample.json"), "utf8"));
    const baseDir = data ? OUT_DIR : path.join(SKILL, "assets");
    const files = listTemplates().map((t) => {
      const p = resolveOut(path.join("gallery", `${t.id}.html`));
      fs.writeFileSync(p, renderResume(d, { template: t.id, color: undefined, baseDir }), "utf8");
      return { ...t, html: p };
    });
    const cards = files.map((t) => `<a class="card" href="${t.id}.html" target="_blank"><div class="thumb"><iframe src="${t.id}.html" loading="lazy"></iframe></div><div class="meta"><b>${t.name}</b>（${t.id}）<br>${t.layout} · ${t.desc}</div></a>`).join("");
    const index = resolveOut(path.join("gallery", "index.html"));
    fs.writeFileSync(index, `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>简历模板一览</title><style>body{font-family:"Microsoft YaHei","PingFang SC",sans-serif;background:#f3f4f6;margin:0;padding:24px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}.card{background:#fff;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,.1);overflow:hidden;color:#333;text-decoration:none}.thumb{height:400px;overflow:hidden}.thumb iframe{width:794px;height:1123px;border:0;transform:scale(.38);transform-origin:0 0;pointer-events:none}.meta{padding:10px 14px;font-size:13px}</style></head><body><h2>简历模板一览</h2><div class="grid">${cards}</div></body></html>`, "utf8");
    return text({ index, templates: files.map((f) => f.id) });
  } catch (e) {
    return fail(e);
  }
});

await server.connect(new StdioServerTransport());
