// MCP 冒烟测试：启动 server.mjs，依次调用全部工具
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const out = fs.mkdtempSync(path.join(os.tmpdir(), "resume-mcp-test-"));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(HERE, "../server.mjs")],
  env: { ...process.env, RESUME_OUTPUT_DIR: out },
});
const client = new Client({ name: "smoke", version: "1.0.0" });
await client.connect(transport);

const json = (r) => JSON.parse(r.content[0].text);
try {
  const tools = (await client.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(tools, ["get_resume_schema", "list_templates", "render_gallery", "render_resume"]);

  const tpls = json(await client.callTool({ name: "list_templates", arguments: {} }));
  assert.equal(tpls.length, 8);

  const schema = await client.callTool({ name: "get_resume_schema", arguments: {} });
  assert.match(schema.content[0].text, /basics/);

  const r = json(await client.callTool({
    name: "render_resume",
    arguments: {
      data: { basics: { name: "李四<script>", phone: "13900000000" }, education: [{ school: "某大学", start: "2021.09" }], skills: ["Python"] },
      template: "sidebar", color: "#aa3366",
    },
  }));
  const html = fs.readFileSync(r.html, "utf8");
  assert.ok(!html.includes("李四<script>"), "姓名应被转义");
  assert.ok(html.includes("#aa3366"));
  assert.ok(r.pdf && fs.existsSync(r.pdf), "应生成 PDF: " + (r.pdfError || ""));

  const bad = await client.callTool({ name: "render_resume", arguments: { data: { basics: { name: "x" } }, fileName: "../../evil", pdf: false } });
  assert.ok(!fs.existsSync(path.join(out, "../../evil.html")), "不应写出输出目录");
  assert.ok(bad.isError || json(bad).html.startsWith(out));

  const g = json(await client.callTool({ name: "render_gallery", arguments: {} }));
  assert.ok(fs.existsSync(g.index));
  console.log("OK", { out, tools });
} finally {
  await client.close();
}
