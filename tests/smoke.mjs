// End-to-end check of the skill's scripts and the generated chart.
// Needs Playwright (require('playwright')) and `npm install` for the export libraries,
// which are served locally in place of the CDN so the test runs offline.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = resolve(import.meta.dirname, "..");
const S = join(ROOT, "skill/gantt/scripts");
const OUT = join(ROOT, "test-results");
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
const node = (script, ...args) => execFileSync("node", [join(S, script), ...args], { encoding: "utf8", cwd: OUT });
const nodeFail = (script, ...args) => spawnSync("node", [join(S, script), ...args], { encoding: "utf8", cwd: OUT });
let passed = 0;
const step = async (name, fn) => { try { await fn(); passed++; console.log("ok   " + name); } catch (e) { console.log("FAIL " + name + "\n     " + e.message.split("\n").join("\n     ")); process.exitCode = 1; } };

const LIBS = {
  "pptxgen.bundle.js": join(ROOT, "node_modules/pptxgenjs/dist/pptxgen.bundle.js"),
  "html-to-image.js": join(ROOT, "node_modules/html-to-image/dist/html-to-image.js"),
};

// ---------- scripts ----------
const chart = join(OUT, "checkout-v2.html");
await step("build example plan", () => { node("build.mjs", join(ROOT, "skill/gantt/examples/checkout-v2.json"), chart); });
await step("build rejects end before start", () => {
  const bad = join(OUT, "bad.json");
  writeFileSync(bad, JSON.stringify({ title: "Bad", phases: [{ name: "A", tasks: [{ name: "x", start: "2027-01-10", end: "2027-01-01" }] }] }));
  const r = nodeFail("build.mjs", bad);
  assert.equal(r.status, 1); assert.match(r.stderr, /before start/);
});
await step("build rejects unknown palette", () => {
  const bad = join(OUT, "bad2.json");
  writeFileSync(bad, JSON.stringify({ title: "Bad", palette: "neon", phases: [{ name: "A", tasks: [] }] }));
  const r = nodeFail("build.mjs", bad); assert.equal(r.status, 1); assert.match(r.stderr, /Unknown palette/);
});
await step("csv import maps columns, dates and deps", () => {
  const csv = join(OUT, "tasks.csv");
  writeFileSync(csv, "Phase,Task,Owner,Start,End,Progress,Depends On,Milestone\nDiscovery,Interviews,RS,03/11/2026,14/11/2026,100%,,\nDiscovery,\"Synthesis, round 1\",NL,2026-11-16,2026-11-20,50,Interviews,\nLaunch,GA,,2026-12-01,,,\"Synthesis, round 1\",yes\n");
  node("csv-to-plan.mjs", csv, join(OUT, "csv-plan.json"), "--title", "CSV test");
  const p = JSON.parse(readFileSync(join(OUT, "csv-plan.json"), "utf8"));
  assert.equal(p.phases.length, 2);
  assert.equal(p.phases[0].tasks[0].start, "2026-11-03");
  assert.equal(p.phases[0].tasks[1].name, "Synthesis, round 1");
  assert.deepEqual(p.phases[0].tasks[1].deps, ["t1"]);
  assert.equal(p.phases[1].tasks[0].milestone, true);
  assert.deepEqual(p.phases[1].tasks[0].deps, ["t2"], "a dependency name containing a comma stays one dependency");
  node("build.mjs", join(OUT, "csv-plan.json"), join(OUT, "csv.html"));
});
await step("palette page with a custom palette", () => {
  const out = node("palette-page.mjs", "--title", "Checkout v2", "--phases", "Discovery,Design,Build,Launch", "--custom", "#0b5fff,#00a389,#ffb020", "--custom-name", "From your logo", join(OUT, "palettes.html"));
  assert.match(out, /1=custom 2=bloom/);
});
const xssPlan = join(OUT, "xss.json");
writeFileSync(xssPlan, JSON.stringify({ title: "</script><script>window.__pwned=1</script>", org: "<b>x</b>", palette: { colors: ["#123456"] },
  phases: [{ name: "<img src=x onerror=window.__pwned=2>", tasks: [{ id: "a\"b", name: "<svg onload=window.__pwned=3>", start: "2027-01-04", end: "2027-01-08", deps: ["nope"] }] }] }));
await step("build with hostile names", () => { node("build.mjs", xssPlan, join(OUT, "xss.html")); });

// ---------- browser ----------
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 }, acceptDownloads: true });
await ctx.route(/cdn\.jsdelivr\.net\/npm\/.*\/(pptxgen\.bundle\.js|html-to-image\.js)$/, (route) => {
  const file = LIBS[route.request().url().split("/").pop()];
  route.fulfill({ status: 200, contentType: "application/javascript", body: readFileSync(file) });
});
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
// The test blocks Google Fonts, so html-to-image's attempt to inline that stylesheet fails. Ignore only that.
const fontNoise = /fonts|ERR_FAILED|remote stylesheet|inlining remote css/;
page.on("console", (m) => { if (m.type() === "error" && !fontNoise.test(m.text())) errors.push(m.text()); });

await page.goto("file://" + chart);
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, "chart-week.png") });

await step("chart renders phases, bars, milestones, today line, deps", async () => {
  assert.equal(await page.locator(".card").count(), 4);
  assert.equal(await page.locator(".bar").count(), 12);
  assert.equal(await page.locator(".ms").count(), 2);
  assert.equal(await page.locator(".today").count(), 1);
  assert.ok((await page.locator("svg.deps path").count()) >= 16);
  assert.equal(await page.locator("#ttl").textContent(), "Checkout v2");
  assert.equal(await page.locator("#org").textContent(), "Acme Payments");
});
await step("statuses computed from dates and progress", async () => {
  const label = (id) => page.locator(`.bar[data-id="${id}"]`).getAttribute("aria-label");
  assert.match(await label("t1"), /Done, 100%/);
  assert.match(await label("t4"), /On-going, 70%/);
  assert.match(await label("t8"), /Upcoming/);
});
await step("drag moves a task, undo restores it", async () => {
  const bar = page.locator('.bar[data-id="t6"]'); const b = await bar.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + 10); await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 14 * 7, b.y + 10, { steps: 6 }); await page.mouse.up();
  const t = await page.evaluate(() => window.__gantt.plan.phases[1].tasks[2]);
  assert.equal(t.start, "2026-12-14"); assert.equal(t.end, "2026-12-22");
  assert.equal(await page.locator("#saveBtn").isDisabled(), false);
  await page.keyboard.press("Control+z");
  const u = await page.evaluate(() => window.__gantt.plan.phases[1].tasks[2]);
  assert.equal(u.start, "2026-12-07");
});
await step("resize right edge changes end only", async () => {
  const bar = page.locator('.bar[data-id="t6"]'); const b = await bar.boundingBox();
  await page.mouse.move(b.x + b.width - 3, b.y + 10); await page.mouse.down();
  await page.mouse.move(b.x + b.width - 3 + 14 * 3, b.y + 10, { steps: 4 }); await page.mouse.up();
  const t = await page.evaluate(() => window.__gantt.plan.phases[1].tasks[2]);
  assert.equal(t.start, "2026-12-07"); assert.equal(t.end, "2026-12-18");
});
await step("zoom levels and collapse render without errors", async () => {
  for (const z of ["day", "month", "quarter", "week"]) { await page.click(`[data-z="${z}"]`); await page.waitForTimeout(80); if (z === "quarter") await page.screenshot({ path: join(OUT, "chart-fit.png") }); }
  await page.click('[data-g="Design"]');
  assert.equal(await page.locator(".bar").count(), 9);
  await page.click('[data-g="Design"]');
  assert.equal(await page.locator(".bar").count(), 12);
});
await step("save writes a file whose plan includes the edit", async () => {
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#saveBtn")]);
  const p = join(OUT, "saved.html"); await dl.saveAs(p);
  const plan = JSON.parse(node("extract.mjs", p));
  assert.equal(plan.phases[1].tasks[2].end, "2026-12-18");
  const html = readFileSync(p, "utf8");
  assert.match(html, /<div class="inner" id="inner"><\/div>/, "saved file should not contain the rendered chart");
  // and it opens again cleanly
  const p2 = await ctx.newPage(); const e2 = []; p2.on("pageerror", (e) => e2.push(e.message));
  await p2.goto("file://" + p); await p2.waitForTimeout(200);
  assert.equal(await p2.locator(".bar").count(), 12); assert.deepEqual(e2, []); await p2.close();
});
await step("PPTX export produces a deck", async () => {
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.click('[data-export="pptx"]')]);
  const p = join(OUT, "checkout-v2.pptx"); await dl.saveAs(p);
  const buf = readFileSync(p);
  assert.equal(buf.subarray(0, 2).toString(), "PK");
  assert.ok(buf.includes("ppt/slides/slide1.xml"));
});
await step("PNG export produces an image", async () => {
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.click('[data-export="png"]')]);
  const p = join(OUT, "checkout-v2.png"); await dl.saveAs(p);
  assert.equal(readFileSync(p).subarray(1, 4).toString(), "PNG");
});
await step("no page errors on the main chart", async () => { assert.deepEqual(errors, []); });

await step("hostile names render as text", async () => {
  const p = await ctx.newPage(); const e = []; p.on("pageerror", (x) => e.push(x.message));
  await p.goto("file://" + join(OUT, "xss.html")); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => window.__pwned), undefined);
  assert.equal(await p.locator("#ttl").textContent(), "</script><script>window.__pwned=1</script>");
  assert.deepEqual(e, []); await p.close();
});
await step("palette page renders all options", async () => {
  const p = await ctx.newPage(); await p.goto("file://" + join(OUT, "palettes.html"));
  assert.equal(await p.locator(".card").count(), 7); // custom + 5 built-in + hex codes
  await p.screenshot({ path: join(OUT, "palettes.png"), fullPage: true }); await p.close();
});

await browser.close();
console.log(`\n${passed} passed${process.exitCode ? ", some failed" : ""}. Screenshots and outputs in test-results/`);
