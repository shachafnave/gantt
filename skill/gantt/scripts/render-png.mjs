#!/usr/bin/env node
// Usage: node render-png.mjs <page.html> <out.png> [--width 1280] [--height 800] [--viewport-only]
// Screenshots a local HTML page (palette chooser or a built chart) so it can be shown inline.
// Needs Playwright with Chromium. If it is missing, exits with code 2 and says so;
// the caller should then open the HTML file instead.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args.splice(i, 2)[1]) : d; };
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? (args.splice(i, 1), true) : false; };
const width = opt("--width", 1280), height = opt("--height", 800), viewportOnly = flag("--viewport-only");
const [inPath, outPath] = args;
if (!inPath || !outPath) { console.error("Usage: node render-png.mjs <page.html> <out.png> [--width N] [--height N] [--viewport-only]"); process.exit(1); }

function loadPlaywright() {
  const bases = [join(process.cwd(), "noop.js"), import.meta.url];
  try { bases.push(join(execSync("npm root -g", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(), "noop.js")); } catch {}
  for (const b of bases) { try { return createRequire(b)("playwright"); } catch {} }
  return null;
}
const pw = loadPlaywright();
if (!pw) { console.error("Playwright is not installed, so no PNG was made. Open the HTML file instead."); process.exit(2); }

let browser;
try { browser = await pw.chromium.launch(); }
catch (e) {
  try { browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); }
  catch { console.error("Playwright could not start Chromium (run `npx playwright install chromium`). Open the HTML file instead."); process.exit(2); }
}
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.continue().catch(() => {}));
await page.goto(pathToFileURL(resolve(inPath)).href, { waitUntil: "load" });
await page.waitForTimeout(400);
await page.screenshot({ path: resolve(outPath), fullPage: !viewportOnly });
await browser.close();
console.log(resolve(outPath));
