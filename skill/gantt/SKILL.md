---
name: gantt
description: Build a polished, interactive Gantt chart for product management by interviewing the user, then writing one self-contained HTML file with drag-to-reschedule, zoom, and PNG, PDF and PPTX export. Use when the user asks for a Gantt, roadmap timeline, project timeline, release plan, or wants to turn a PRD, task list, CSV, Excel sheet, or Jira, monday or Linear data into a timeline.
---

# Gantt builder

You interview the user, write a plan file, show a palette chooser, then build the
chart. The scripts are plain Node (18+), no install step. They live next to this
file: use the skill's base directory (shown when the skill loads) as `$SKILL`.

| Script | Does |
| --- | --- |
| `node $SKILL/scripts/build.mjs plan.json [out.html]` | Validates the plan, inlines the logo, writes the chart. Prints warnings. |
| `node $SKILL/scripts/palette-page.mjs --title T --phases "A,B" [--custom "#a,#b" --custom-name N] [--logo] out.html` | Writes the palette chooser page. |
| `node $SKILL/scripts/csv-to-plan.mjs tasks.csv plan.json [--title T] [--mdy]` | Converts a task list to a plan. |
| `node $SKILL/scripts/extract.mjs chart.html [plan.json]` | Reads a plan back out of a chart, including edits the user saved in the browser. |

The plan format and the field mapping for Jira, monday and Linear are in
`$SKILL/reference/plan-schema.md`. Read it before writing a plan.
`$SKILL/examples/checkout-v2.json` is a complete example.

## Where files go

Work in `gantt/<plan-slug>/` under the current directory unless the user names a
place: `plan.json`, `palettes.html`, `<plan-slug>.html`, and the logo if they
send one. Tell the user the paths.

To show a page, open it: `open` on macOS, `xdg-open` on Linux, `start ""` on
Windows. If there is no desktop (a remote or cloud session), send or link the
file instead and say where it is.

## The interview

Ask in this order. Use the AskUserQuestion tool where the answers are choices.
Ask only what you cannot get from what the user already gave you; never ask for
something the source already contains. Keep each turn short.

### 1. Source

Ask where the plan comes from. Options:

- **Interview from scratch.** Go to step 2 and ask for everything.
- **Paste text or a doc** (PRD, roadmap notes, meeting notes, an email). Extract
  phases, tasks, owners, dates and dependencies yourself, then show what you
  found as a short table and ask only about the gaps.
- **CSV or Excel.** For CSV run `csv-to-plan.mjs`. For Excel, convert the sheet
  to CSV first (Python `openpyxl` or `pandas` if available; otherwise ask the
  user to save it as CSV), then run the script. If the column names do not match,
  rename the header row rather than guessing per row.
- **Jira, monday.com, or Linear.** Use the connector tools for that service if
  they are available in this session (search with ToolSearch for the service
  name). If the connector needs sign-in, tell the user to authorize it in their
  connector settings, and offer CSV export from that tool as the fallback. Map
  fields with the table in `plan-schema.md`. Ask which project, board, or epic to
  pull, and cap it at about 60 tasks unless the user wants more.

### 2. Plan basics

Title, a one-line subtitle (team and time frame), and the phases in order. A
phase is whatever groups the work: discovery and delivery stages, epics,
workstreams, or quarters. Suggest phases from the source when you can and let
the user correct them.

### 3. Gaps

For each task you need a name and dates. Owner, percent complete, dependencies
and milestones are optional but make the chart useful; ask once, as a batch,
for whichever are missing across the plan, for example "Who owns these 6
tasks?" rather than one question per task. Rules:

- Dates are YYYY-MM-DD and the end date is inclusive.
- If the user gives durations ("two weeks after design"), compute the dates and
  confirm the result in the summary, not one by one.
- Never invent dates or owners. A task with no date goes in the plan without a
  start; the build warns and the chart lists it without a bar.
- Milestones are single-day events: launches, sign-offs, reviews.

### 4. Branding

Ask for the organization name and a logo. Both are optional. A logo can be a
file path, an image they attach, or a URL. Save an attached image next to
`plan.json` and reference it by relative path. Transparent PNG or SVG looks
best; say so if they send a JPG with a white box.

### 5. Palette

Always ask this before building. Build the chooser page:

```bash
node $SKILL/scripts/palette-page.mjs --title "<title>" --phases "<phase1>,<phase2>,..." gantt/<slug>/palettes.html
```

If the user gave a logo, look at it, pick 3 or 4 of its main colors that work as
bar colors (skip near-white and near-black backgrounds, keep enough contrast
between them), and pass them as a suggested palette:

```bash
node $SKILL/scripts/palette-page.mjs --title "<title>" --phases "..." --logo --custom "#0b5fff,#00a389,#ffb020,#e5484d" --custom-name "From your logo" gantt/<slug>/palettes.html
```

Open the page and ask the user to pick by number or name, or to give their own
hex codes. The script prints which number maps to which palette. Store the
choice in `plan.json` as an id (`"bloom"`) or a custom object
(`{"name":"Brand","colors":[...],"today":"#hex"}`).

### 6. Confirm and build

Show a compact summary: phases with task counts, the date range, and anything
still missing. Then write `plan.json` and run `build.mjs`. Fix any errors it
reports and pass its warnings on to the user. Open the chart.

Tell the user what the chart does, in one short list:

- Drag a bar to move it, drag its edges to change dates. Undo with Ctrl or Cmd+Z.
- Day, Week, Month and Fit zoom. Click a phase to collapse it.
- **Save** downloads a copy of the file with their changes. Replace the old file
  with it.
- **PNG** and **Export PPTX** download files. **PDF** opens the print dialog
  fitted to a landscape page; choose "Save as PDF". The PPTX uses native shapes,
  so it stays editable in PowerPoint and Keynote, one slide per page of rows.
- Exports load a small library from the internet the first time they run.

## Changing an existing chart

When the user wants changes to a chart they already have, run `extract.mjs` on
the latest HTML file (it includes edits they dragged and saved), edit the JSON,
and rebuild. Do not re-run the whole interview. To change only the palette or
logo, edit those fields and rebuild.

## Quality bar

- Phase names and task names are the user's words, trimmed, not rewritten into
  marketing language.
- Do not pad the plan with tasks the user did not mention. If something looks
  missing (no launch or QA phase, a dependency loop), say so once and let them
  decide.
- No em dashes in titles, subtitles or task names. Use a comma, colon or pipe.
- Before you report it done, read the build output: zero errors, and every
  warning either fixed or passed on to the user.
