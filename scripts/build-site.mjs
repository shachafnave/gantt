#!/usr/bin/env node
// Builds the GitHub Pages site into _site/: landing page, live demo chart, palette chooser.
// Used by .github/workflows/pages.yml; run locally with `npm run site`.
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "_site");
const S = join(ROOT, "skill/gantt/scripts");
const run = (script, ...args) => execFileSync("node", [join(S, script), ...args], { stdio: "inherit" });

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "demo"), { recursive: true });
mkdirSync(join(OUT, "palettes"), { recursive: true });
run("build.mjs", join(ROOT, "skill/gantt/examples/checkout-v2.json"), join(OUT, "demo/index.html"));
run("palette-page.mjs", "--title", "Checkout v2", "--phases", "Discovery,Design,Build,Launch", join(OUT, "palettes/index.html"));
cpSync(join(ROOT, "site"), OUT, { recursive: true });
if (existsSync(join(ROOT, "media"))) cpSync(join(ROOT, "media"), join(OUT, "media"), { recursive: true });
writeFileSync(join(OUT, ".nojekyll"), "");
console.log("Site built in " + OUT);
