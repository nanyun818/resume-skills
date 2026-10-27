import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** 查找本机 Chrome / Edge / Chromium，可用环境变量 CHROME_PATH 指定 */
export function findBrowser() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = {
    win32: [
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
      path.join(os.homedir(), "AppData/Local/Google/Chrome/Application/chrome.exe"),
    ],
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ],
    linux: ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"],
  }[process.platform] || [];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

/** 用无头浏览器把 HTML 文件打印成 A4 PDF */
export function htmlToPdf(htmlPath, pdfPath) {
  const browser = findBrowser();
  if (!browser) throw new Error("未找到 Chrome/Edge，请安装浏览器或设置环境变量 CHROME_PATH；也可以用浏览器打开 HTML 后 Ctrl+P 另存为 PDF。");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "resume-chrome-"));
  try {
    execFileSync(browser, [
      "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
      `--user-data-dir=${profile}`,
      "--no-pdf-header-footer", "--print-to-pdf-no-header",
      `--print-to-pdf=${path.resolve(pdfPath)}`,
      pathToFileURL(path.resolve(htmlPath)).href,
    ], { stdio: "ignore", timeout: 60000 });
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
  }
  if (!fs.existsSync(pdfPath)) throw new Error("PDF 生成失败：浏览器未输出文件");
  return pdfPath;
}
