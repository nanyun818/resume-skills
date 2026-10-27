import fs from "node:fs";
import path from "node:path";

/** HTML 转义，防止简历内容破坏页面结构或注入脚本 */
export function esc(v) {
  if (v === undefined || v === null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 支持 **加粗** 的轻量行内格式，其余内容全部转义 */
export function inline(v) {
  return esc(v).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/** 时间区间："2020.09" + "2024.06" => "2020.09 - 2024.06"；end 为空时显示"至今" */
export function range(start, end) {
  if (!start && !end) return "";
  if (!end) return `${esc(start)} - 至今`;
  if (!start) return esc(end);
  return `${esc(start)} - ${esc(end)}`;
}

export function arr(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml" };

/** 把本地头像转成 data URI，HTML 单文件即可离线显示；http(s)/data: 地址原样返回 */
export function loadPhoto(photo, baseDir) {
  if (!photo) return "";
  if (/^(https?:|data:)/i.test(photo)) return photo;
  const p = path.isAbsolute(photo) ? photo : path.resolve(baseDir || process.cwd(), photo);
  const mime = MIME[path.extname(p).toLowerCase()];
  if (!mime || !fs.existsSync(p)) {
    console.error(`[resume] 头像不存在或格式不支持，已忽略: ${p}`);
    return "";
  }
  return `data:${mime};base64,${fs.readFileSync(p).toString("base64")}`;
}

/** 校验主题色，仅允许 #RGB / #RRGGBB，避免 CSS 注入 */
export function safeColor(c, fallback) {
  return typeof c === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? c : fallback;
}
