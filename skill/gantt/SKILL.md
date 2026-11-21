---
name: gantt
description: Build a polished, interactive Gantt chart for product management. Always runs a short interview first (source, basics, gaps, branding, palette chooser), then writes one self-contained HTML file with drag-to-reschedule, zoom, and PNG, PDF and PPTX export. Use when the user asks for a Gantt, roadmap timeline, project timeline, release plan, or wants to turn a PRD, task list, CSV, Excel sheet, or Jira, monday or Linear data into a timeline.
---

# Gantt builder

You interview the user, write a plan file, show a palette chooser, then build the
chart.

## The interview is mandatory

Every run goes through the interview below, in order, before anything is built.
This holds even when the request is "build me a Gantt from this file" and the
file looks complete. A request to build a Gantt is a request to start the
interview. Complete data shortens the interview (you confirm instead of ask);
it never removes it.

Steps 2 (titles), 4 (branding) and 5 (palette) are always asked, whatever the
source contains. Never pick a chart title, subtitle, group title, or palette for
the user and build.

The only way to skip is the user saying so in their own words ("skip the
questions", "just use defaults"). Then use defaults (`bloom` palette, no logo,
title from the source), build, and list the defaults you chose so they can
change them.

| Thought | Reality |
| --- | --- |
| "The spreadsheet has everything, I'll just build it." | Confirm what you extracted, then ask titles, branding and palette. |
| "The source already names the groups." | Show them and ask the user to keep or rename each one. |
| "They only asked for the chart." | Asking for the chart is how the interview starts. |
| "I'll use the default palette and mention it after." | The palette chooser is a required step. Show it and wait. |
| "Asking will slow them down." | Batch the questions; one or two turns is enough. Building the wrong thing is slower. |
| "I'll ask everything in one long message." | Use AskUserQuestion for choices and keep each turn short. | The scripts are plain Node (18+), no install step. They live next to this
file: use the skill's base directory (shown when the skill loads) as `$SKILL`.

| Script | Does |
| --- | --- |
| `node $SKILL/scripts/build.mjs plan.json [out.html]` | Validates the plan, inlines the logo, writes the chart. Prints warnings. |
| `node $SKILL/scripts/palette-page.mjs --title T --phases "A,B" [--custom "#a,#b" --custom-name N] [--logo] out.html` | Writes the palette chooser page. |
| `node $SKILL/scripts/csv-to-plan.mjs tasks.csv plan.json [--title T] [--mdy]` | Converts a task list to a plan. |
| `node $SKILL/scripts/render-png.mjs page.html out.png [--viewport-only] [--width N]` | Screenshots the palette chooser or a chart so you can show it inline. Exit code 2 means no Playwright: open the HTML instead. |
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

Ask in this order. Use the AskUserQuestion tool for every step that has choices
(source, palette, yes/no confirmations); if it is not available, ask in plain
text and wait for the answer. Do not ask for facts the source already contains:
show what you extracted and ask the user to confirm or correct it. Keep each
turn short, and wait for the user's answer before moving to the next step.

If the user already chose the source (attached a file, pasted text, named a
board), skip the step 1 question and say which source you are using.

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

### 2. Titles

Always ask, in one turn:

- **Chart title**, shown large in the header and used for file names.
- **Subtitle**, one line under it (team, time frame, version). Optional, but ask.
- **A title for each group.** Groups are the phase cards: stages, epics,
  workstreams, or quarters. List every group you found in the source, in order,
  with its current name and task count, and ask the user to keep, rename,
  merge, or reorder them. If the source has no grouping, propose groups and
  ask. Group titles are what readers scan first, so source labels like
  `EPIC-12` or `Phase 3` are worth renaming.

Suggest a title and subtitle from the source so the user can just say "yes",
for example:

```
Chart title:  Checkout v2 (suggested)
Subtitle:     Payments squad | Nov 2026 to Feb 2027 (suggested)
Groups:
  1. Discovery   4 tasks
  2. Design      3 tasks
  3. Build       4 tasks
  4. Launch      3 tasks
Keep these, or tell me what to change.
```

Use exactly the names the user confirms. Store the group titles as
`phases[].name`, in the confirmed order.

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

Ask for the organization name, and handle the logo:

- **The user attached an image** (now or earlier in the conversation): that is
  the logo. Do not ask whether they have one; say "I'll use the logo you
  attached". Find the file on disk: attachments are saved under an uploads
  folder (for example `~/.claude/uploads/<session>/`, or the path shown with the
  attachment); search for it by file name if needed. Copy it to
  `gantt/<slug>/logo.<ext>` and set `"logo": "logo.<ext>"` in the plan.
- **The image is only visible in the chat** and you cannot find a file for it:
  ask the user to drag the file into the terminal (that pastes its path) or give
  a path or URL. Do not build without it if they want a logo.
- **No image:** ask if they want a logo (file path, URL, or attach one). It is
  optional.

Transparent PNG or SVG looks best; mention it if they send a JPG with a white
box. `build.mjs` prints a `logo:` line. If it says `none` when the user gave a
logo, fix the path before showing the chart.

### 5. Palette

Always ask this before building, and show it as a picture, not a link.

1. Build the chooser page. If there is a logo, look at it, pick 3 or 4 of its
   main colors that work as bar colors (skip near-white and near-black
   backgrounds, keep them distinct), and pass them as a suggested palette:

   ```bash
   node $SKILL/scripts/palette-page.mjs --title "<title>" --phases "<group1>,<group2>,..." [--logo --custom "#0b5fff,#00a389,#ffb020" --custom-name "From your logo"] gantt/<slug>/palettes.html
   ```

2. Render it to a PNG and show the PNG to the user:

   ```bash
   node $SKILL/scripts/render-png.mjs gantt/<slug>/palettes.html gantt/<slug>/palettes.png
   ```

   Show it inline: in the Claude app or a cloud session, send the PNG as a file
   so it renders in the chat; in a terminal on the user's machine, open the PNG
   with the OS opener. If the script exits with code 2 (no Playwright), open
   `palettes.html` in the browser instead.

3. Ask with AskUserQuestion, one question, up to 4 options, each with a
   `preview` showing the colors per group. If there is a logo palette, offer it
   first as "(Recommended)", then Bloom, Harbor, Studio; otherwise Bloom,
   Harbor, Studio, Citrus. Say in the question that Ink, the others, or their own
   hex codes can be typed under "Other". Preview format:

   ```
   Discovery  ■■■■■■  #E5487F
   Design     ■■■■■■  #4FAE5C
   Build      ■■■■■■  #EF8A3A
   Launch     ■■■■■■  #7867E0
   Today line         #4B44C8
   ```

   Use the user's real group titles, cycling colors when there are more groups
   than colors. Built-in palettes: `$SKILL/scripts/palettes.mjs`.

Store the choice in `plan.json` as an id (`"bloom"`) or a custom object
(`{"name":"From your logo","colors":[...],"today":"#hex"}`).

### 6. Confirm and build

Show a compact summary: the chart title and subtitle, the group titles with task
counts, the date range, the palette,
the branding, and anything still missing. Ask for a go-ahead (AskUserQuestion:
"Build it" / "Change something"). Only after a yes, write `plan.json` and run
`build.mjs`. Fix any errors it
reports and pass its warnings on to the user.

Then show the result the same way as the palette: render a preview with
`render-png.mjs gantt/<slug>/<slug>.html gantt/<slug>/<slug>.png --viewport-only
--width 1440` and show the PNG inline, and give the HTML path (open it on the
user's machine when there is a desktop). Check the preview yourself before
sending: the logo is in the header if one was given, the group titles and
colors match what the user chose.

Tell the user what the chart does, in one short list:

- Drag a bar to move it, drag its edges to change dates. Undo with Ctrl or Cmd+Z.
- Day, Week, Month and Fit zoom. Click a phase to collapse it.
- **Present** (or press P) opens a full-screen 16:9 slide deck: an overview
  with one bar per group, one slide per group (long groups split across
  slides), and a milestones slide. Arrow keys, Space or a click move between
  slides; Esc exits. Adding `#slide-3` to the file's address opens straight
  on that slide.
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
