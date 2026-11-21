#!/usr/bin/env node
// Usage: node extract.mjs <gantt.html> [plan.json]
// Pulls the plan (including edits saved from the browser) back out of a generated Gantt file.
import { readFileSync, writeFileSync } from "node:fs";
const [, , inPath, outPath] = process.argv;
if (!inPath) { console.error("Usage: node extract.mjs <gantt.html> [plan.json]"); process.exit(1); }
const html = readFileSync(inPath, "utf8");
const m = html.match(/<script id="plan-data" type="application\/json">([\s\S]*?)<\/script>/);
if (!m) { console.error("No plan data found. Is this a Gantt file built by this skill?"); process.exit(1); }
const plan = JSON.parse(m[1]);
const json = JSON.stringify(plan, null, 2) + "\n";
if (outPath) { writeFileSync(outPath, json); console.log(outPath); } else process.stdout.write(json);
