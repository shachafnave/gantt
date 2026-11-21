#!/usr/bin/env node
// Regenerates the README and site screenshots in media/ from the example plan.
// Needs Playwright with Chromium. Run with `npm run screenshots`.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

const ROOT = resolve(import.meta.dirname, "..");
const { chromium } = createRequire(join(process.cwd(), "noop.js"))("playwright");
const MEDIA = join(ROOT, "media"), TMP = join(ROOT, "test-results", "shots");
mkdirSync(MEDIA, { recursive: true }); mkdirSync(TMP, { recursive: true });
const S = join(ROOT, "skill/gantt/scripts");
execFileSync("node", [join(S, "build.mjs"), join(ROOT, "skill/gantt/examples/checkout-v2.json"), join(TMP, "chart.html")]);
execFileSync("node", [join(S, "palette-page.mjs"), "--title", "Checkout v2", "--phases", "Discovery,Design,Build,Launch", join(TMP, "palettes.html")]);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1360, height: 820 }, deviceScaleFactor: 2 });
await p.goto("file://" + join(TMP, "chart.html")); await p.waitForTimeout(600);
await p.screenshot({ path: join(MEDIA, "chart.png") });

await p.setViewportSize({ width: 1280, height: 720 });
await p.click("#presentBtn"); await p.waitForTimeout(300);
await p.addStyleTag({ content: ".s-hint,.s-exit{display:none!important}" });
await p.screenshot({ path: join(MEDIA, "present-overview.png") });
await p.keyboard.press("ArrowRight"); await p.keyboard.press("ArrowRight"); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(150);
await p.screenshot({ path: join(MEDIA, "present-group.png") });
const q = await b.newPage({ viewport: { width: 1280, height: 400 }, deviceScaleFactor: 2 });
await q.goto("file://" + join(TMP, "palettes.html")); await q.waitForTimeout(500);
await q.screenshot({ path: join(MEDIA, "palettes.png"), fullPage: true });
await b.close();
console.log("Screenshots written to " + MEDIA);
