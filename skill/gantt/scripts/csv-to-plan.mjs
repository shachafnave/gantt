#!/usr/bin/env node
// Usage: node csv-to-plan.mjs <tasks.csv> [plan.json] [--title "Plan"]
// Columns (header names are matched loosely, order does not matter):
//   phase, task, owner, start, end, progress, depends_on, milestone, id
// Dates: YYYY-MM-DD, DD/MM/YYYY or MM/DD/YYYY (set --dmy or --mdy when ambiguous; default dmy).
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? (args.splice(i, 1), true) : false; };
const title = opt("--title");
const mdy = flag("--mdy"); flag("--dmy");
const [inPath, outPath] = args;
if (!inPath) { console.error("Usage: node csv-to-plan.mjs <tasks.csv> [plan.json] [--title T] [--mdy]"); process.exit(1); }

function parseCSV(text) {
  const rows = []; let row = [], f = "", q = false;
  const sep = (text.split("\n")[0].match(/;/g) || []).length > (text.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}
const ALIASES = {
  phase: ["phase", "group", "epic", "stage", "workstream", "category"],
  name: ["task", "name", "title", "summary", "item"],
  owner: ["owner", "assignee", "person", "responsible"],
  start: ["start", "start date", "begin", "from"],
  end: ["end", "end date", "due", "due date", "finish", "to"],
  pct: ["progress", "pct", "%", "percent", "complete", "% complete"],
  deps: ["depends_on", "depends on", "dependencies", "deps", "predecessors", "blocked by"],
  milestone: ["milestone", "is milestone", "type"],
  id: ["id", "key", "task id"],
};
function toISO(s, where) {
  s = String(s || "").trim(); if (!s) return undefined;
  let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  if ((m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/))) {
    let [, a, b, y] = m; if (y.length === 2) y = "20" + y;
    const [d, mo] = mdy ? [b, a] : [a, b];
    if (+mo > 12 || +d > 31) throw new Error(`${where}: can't read date "${s}" (try --mdy or --dmy)`);
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  throw new Error(`${where}: unsupported date "${s}". Use YYYY-MM-DD.`);
}

const rows = parseCSV(readFileSync(inPath, "utf8").replace(/^﻿/, ""));
if (rows.length < 2) { console.error("CSV needs a header row and at least one task."); process.exit(1); }
const header = rows[0].map((h) => h.trim().toLowerCase());
const col = {};
for (const [k, names] of Object.entries(ALIASES)) { const i = header.findIndex((h) => names.includes(h)); if (i >= 0) col[k] = i; }
if (col.name === undefined) { console.error(`No task-name column found. Header was: ${rows[0].join(", ")}`); process.exit(1); }

const phases = new Map(); const nameToId = new Map(); let n = 0;
const tasks = [];
for (const [ri, r] of rows.slice(1).entries()) {
  const get = (k) => (col[k] === undefined ? "" : (r[col[k]] || "").trim());
  const where = `Row ${ri + 2}`;
  const ph = get("phase") || "Tasks";
  if (!phases.has(ph)) phases.set(ph, { name: ph, tasks: [] });
  const id = get("id") || `t${++n}`;
  const ms = /^(y|yes|true|1|x|milestone)$/i.test(get("milestone"));
  const t = { id, name: get("name"), owner: get("owner") || undefined, start: toISO(get("start"), where), milestone: ms || undefined };
  if (!ms) t.end = toISO(get("end"), where) || t.start;
  const pct = get("pct").replace("%", ""); if (pct) t.pct = Number(pct) <= 1 && pct.includes(".") ? Math.round(Number(pct) * 100) : Number(pct);
  t._deps = get("deps");
  nameToId.set(t.name.toLowerCase(), id);
  phases.get(ph).tasks.push(t); tasks.push(t);
}
for (const t of tasks) {
  if (t._deps) {
    const resolveDep = (d) => (tasks.some((x) => x.id === d) ? d : nameToId.get(d.toLowerCase()));
    const whole = t._deps.trim();
    // A task name may itself contain commas, so try the whole value first, then ";" lists, then "," lists.
    const parts = resolveDep(whole) ? [whole] : whole.includes(";") ? whole.split(";") : whole.split(",");
    t.deps = parts.map((s) => s.trim()).filter(Boolean).map((d) => resolveDep(d) || d);
  }
  delete t._deps;
}
const plan = { title: title || inPath.replace(/^.*[\\/]/, "").replace(/\.\w+$/, ""), palette: "bloom", phases: [...phases.values()] };
const json = JSON.stringify(plan, null, 2) + "\n";
if (outPath) { writeFileSync(outPath, json); console.log(outPath); } else process.stdout.write(json);
