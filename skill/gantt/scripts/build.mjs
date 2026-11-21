#!/usr/bin/env node
// Usage: node build.mjs <plan.json> [out.html]
// Validates the plan, inlines the logo, and writes one self-contained Gantt HTML file.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { PALETTES } from "./palettes.mjs";
import { validatePlan, inlineLogo, slug, here, scriptJSON } from "./lib.mjs";

const [, , inPath, outArg] = process.argv;
if (!inPath) { console.error("Usage: node build.mjs <plan.json> [out.html]"); process.exit(1); }
const src = resolve(inPath);
let raw;
try { raw = JSON.parse(readFileSync(src, "utf8")); }
catch (e) { console.error(`Could not read ${src}: ${e.message}`); process.exit(1); }

try {
  const { plan, warnings } = validatePlan(raw);
  const logoSrc = plan.logo;
  plan.logo = inlineLogo(plan.logo, dirname(src));
  if (plan.logo && plan.logo.startsWith("data:")) {
    const kb = Math.round((plan.logo.length * 3) / 4 / 1024);
    console.log(`logo: embedded ${logoSrc.startsWith("data:") ? "data URI" : logoSrc} (${kb} KB)`);
    if (kb > 600) warnings.push(`Logo is ${kb} KB; a smaller PNG or SVG keeps the file light.`);
  } else if (plan.logo) console.log(`logo: linked ${plan.logo} (loads from the web)`);
  else console.log("logo: none");
  const tpl = readFileSync(join(here(import.meta.url), "..", "template", "gantt.html"), "utf8");
  const html = tpl.replace("/*__PLAN__*/", () => scriptJSON(plan)).replace("/*__PALETTES__*/", () => scriptJSON(PALETTES));
  const out = resolve(outArg || join(dirname(src), `${slug(plan.title)}.html`));
  writeFileSync(out, html);
  for (const w of warnings) console.warn("warning: " + w);
  console.log(out);
} catch (e) { console.error(e.message); process.exit(1); }
