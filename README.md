# 简历 Skill + MCP

- `resume-builder/`：Claude Code Skill（脚本只依赖 Node 18+，导出 PDF 需要 Chrome 或 Edge）
- `resume-mcp/`：MCP 服务（stdio），复用 resume-builder 的模板，两个目录需放在一起

## 安装 Skill

把 `resume-builder` 复制到 `~/.claude/skills/`（全局）或项目的 `.claude/skills/` 下。

## 配置 MCP

```bash
cd resume-mcp && npm install
claude mcp add resume -e RESUME_OUTPUT_DIR="D:/简历输出" -- node "D:/简历-skills/resume-mcp/server.mjs"
```

工具：`list_templates`、`get_resume_schema`、`render_resume`、`render_gallery`。
文件只会写到 `RESUME_OUTPUT_DIR` 内（默认是启动目录下的 `resume-output/`）。

测试：`node resume-mcp/test/smoke.mjs`

## 预览

`_preview/index.html` 是 8 套模板的对比页（示例数据），重新生成：

```bash
node resume-builder/scripts/resume.mjs gallery --out _preview --pdf
```
