import { TEMPLATES } from "./templates.mjs";
import { documentHtml } from "./layout.mjs";
import { loadPhoto, safeColor } from "./util.mjs";

const FONTS = {
  sans: `"PingFang SC","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC",sans-serif`,
  serif: `"Songti SC","SimSun","Noto Serif CJK SC","Source Han Serif SC",serif`,
  kai: `"Kaiti SC","KaiTi","STKaiti",serif`,
};

function hex6(c) {
  return c.length === 4 ? "#" + [...c.slice(1)].map((x) => x + x).join("") : c;
}

/**
 * 渲染简历为 HTML 字符串
 * @param {object} data   简历 JSON（见 references/schema.md）
 * @param {object} opts   { template, color, font, fontSize, baseDir }；未传时取 data.theme
 */
export function renderResume(data, opts = {}) {
  const theme = { ...(data.theme || {}), ...Object.fromEntries(Object.entries(opts).filter(([, v]) => v !== undefined)) };
  const id = theme.template || "classic";
  const tpl = TEMPLATES[id];
  if (!tpl) throw new Error(`未知模板 "${id}"，可选：${Object.keys(TEMPLATES).join(", ")}`);

  const color = hex6(safeColor(theme.color, tpl.color));
  const fs = Number(theme.fontSize) >= 10 && Number(theme.fontSize) <= 16 ? Number(theme.fontSize) : 13;
  const photo = theme.hidePhoto ? "" : loadPhoto(data.basics?.photo, theme.baseDir);
  const { body, css } = tpl.render(data, photo);

  return documentHtml({
    title: `${data.basics?.name || "简历"} - 简历`,
    vars: { "--c": color, "--c-soft": color + "1f", "--fs": fs + "px", "--font": FONTS[theme.font] || FONTS.sans },
    css,
    body,
    tpl: id,
    onePage: theme.onePage !== false,
  });
}
