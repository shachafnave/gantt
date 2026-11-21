#!/usr/bin/env node
// Usage: node palette-page.mjs --title "Plan" [--phases "A,B,C"] [--custom "#a,#b,#c" --custom-name "From your logo"] [--logo] [out.html]
// Writes the palette chooser page the skill shows before building.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { PALETTES, isHex } from "./palettes.mjs";
import { here, scriptJSON } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? (args.splice(i, 1), true) : false; };
const title = opt("--title") || "your plan";
const phases = (opt("--phases") || "").split(",").map((s) => s.trim()).filter(Boolean);
const custom = opt("--custom"), customName = opt("--custom-name") || "Custom", customToday = opt("--custom-today");
const hasLogo = flag("--logo");
const out = resolve(args[0] || "palettes.html");

const palettes = PALETTES.map((p) => ({ ...p }));
if (custom) {
  const colors = custom.split(/[,\s]+/).filter(Boolean);
  const bad = colors.filter((c) => !isHex(c));
  if (bad.length || !colors.length) { console.error(`--custom needs hex codes, bad: ${bad.join(", ") || "(none given)"}`); process.exit(1); }
  palettes.unshift({ id: "custom", name: customName, note: "Suggested", colors, today: customToday && isHex(customToday) ? customToday : "#22232a", suggested: true });
}
const tpl = readFileSync(join(here(import.meta.url), "..", "template", "palettes.html"), "utf8");
writeFileSync(out, tpl.replace("/*__DATA__*/", () => scriptJSON({ title, phases, palettes, hasLogo: hasLogo || !!custom })));
console.log(out);
console.log("Options: " + palettes.map((p, i) => `${i + 1}=${p.id === "custom" ? "custom" : p.id}`).join(" "));
