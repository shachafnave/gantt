import { readFileSync, existsSync } from "node:fs";
import { extname, resolve, dirname } from "node:path";
import { normalizePalette } from "./palettes.mjs";

export const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".gif": "image/gif" };

// Turn a local logo path into a data URI so the HTML stays a single file.
export function inlineLogo(logo, baseDir) {
  if (!logo || /^(data:|https?:)/.test(logo)) return logo || "";
  const p = resolve(baseDir, logo);
  if (!existsSync(p)) throw new Error(`Logo file not found: ${p}`);
  const mime = MIME[extname(p).toLowerCase()];
  if (!mime) throw new Error(`Unsupported logo type ${extname(p)}. Use PNG, JPG, SVG, WEBP or GIF.`);
  return `data:${mime};base64,${readFileSync(p).toString("base64")}`;
}

// Validate and normalize a plan. Returns {plan, warnings}; throws on errors that would break the chart.
export function validatePlan(input) {
  const errors = [], warnings = [];
  const plan = structuredClone(input);
  if (!plan.title) warnings.push("No title; using \"Untitled plan\".");
  if (!Array.isArray(plan.phases) || !plan.phases.length) errors.push("Plan needs a non-empty \"phases\" array.");
  try { plan.palette = normalizePalette(plan.palette); } catch (e) { errors.push(e.message); }
  for (const k of ["today", "start", "end"]) if (plan[k] && !DATE.test(plan[k])) errors.push(`"${k}" must be YYYY-MM-DD, got ${plan[k]}`);
  const ids = new Set();
  let n = 0;
  (plan.phases || []).forEach((ph, pi) => {
    if (!ph.name) errors.push(`Phase ${pi + 1} has no name.`);
    ph.tasks = ph.tasks || [];
    ph.tasks.forEach((t) => {
      n++;
      if (t.id === undefined || t.id === null || t.id === "") t.id = `t${n}`;
      t.id = String(t.id);
      if (ids.has(t.id)) errors.push(`Duplicate task id "${t.id}".`);
      ids.add(t.id);
      const where = `Task "${t.name || t.id}"`;
      if (!t.name) errors.push(`${where} has no name.`);
      if (!t.start) warnings.push(`${where} has no start date; it shows in the list without a bar.`);
      else if (!DATE.test(t.start)) errors.push(`${where}: start must be YYYY-MM-DD, got ${t.start}`);
      if (!t.milestone) {
        if (t.end && !DATE.test(t.end)) errors.push(`${where}: end must be YYYY-MM-DD, got ${t.end}`);
        if (t.start && t.end && t.end < t.start) errors.push(`${where}: end ${t.end} is before start ${t.start}.`);
        if (t.start && !t.end) { t.end = t.start; warnings.push(`${where} has no end date; drawn as one day.`); }
      }
      if (t.pct !== undefined) {
        const p = Number(t.pct);
        if (!Number.isFinite(p) || p < 0 || p > 100) errors.push(`${where}: pct must be 0 to 100, got ${t.pct}`);
        else t.pct = Math.round(p);
      } else t.pct = 0;
      if (t.deps && !Array.isArray(t.deps)) t.deps = String(t.deps).split(/[,;\s]+/).filter(Boolean);
    });
  });
  for (const ph of plan.phases || []) for (const t of ph.tasks) for (const d of t.deps || []) if (!ids.has(String(d))) warnings.push(`Task "${t.name}" depends on unknown id "${d}"; arrow skipped.`);
  if (errors.length) { const e = new Error("Plan is invalid:\n- " + errors.join("\n- ")); e.errors = errors; throw e; }
  return { plan, warnings };
}

export const slug = (s) => String(s || "gantt").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "gantt";
export const here = (url) => dirname(new URL(url).pathname);
// JSON that is safe inside a <script> tag.
export const scriptJSON = (v) => JSON.stringify(v, null, 1).replace(/</g, "\\u003c");
