# gantt

A Claude Code skill that builds fast, well-designed Gantt charts for product management. It interviews you, shows you palette options, and writes one self-contained HTML file you can open, edit by dragging, and export.

## Install

Requires [Node](https://nodejs.org) 18 or newer.

```bash
git clone https://github.com/shachafnave/gantt
```

```bash
cd gantt && ./install.sh
```

Working inside this repo needs no install: `.claude/skills/gantt` is committed, so Claude Code picks up `/gantt` here automatically. To use it in other projects, `./install.sh` links the skill into `~/.claude/skills/gantt`. Use `./install.sh --project` to install it for one project only, or add `--copy` to copy instead of link.

## Use

In Claude Code, ask for a Gantt or type `/gantt`. The skill asks, in order:

1. **Source:** interview from scratch, paste a doc (PRD, notes), a CSV or Excel file, or pull from Jira, monday.com or Linear through their connectors.
2. **Titles:** chart title, subtitle, and a title for each group (phase card). Always asked, with suggestions from your source.
3. **Gaps:** only what the source did not give: dates, owners, dependencies, milestones.
4. **Branding:** organization name and logo. A logo you attach in the chat is picked up and placed in the chart header.
5. **Palette:** shows the palette options as an image in the chat (five built-in palettes, one pulled from your logo, or your own hex codes), then asks you to pick in a selection prompt with color previews.
6. **Build:** writes `gantt/<plan>/plan.json` and `gantt/<plan>/<plan>.html` and opens it.

## The chart

- Phase cards with status pills (Done, On-going, Overdue, Upcoming), percent complete, owners, milestones and dependency arrows.
- Drag bars to move them, drag edges to change dates, Ctrl or Cmd+Z to undo.
- Day, Week, Month and Fit zoom. Click a phase to collapse it.
- **Save** downloads a copy of the file with your edits. **PNG**, **PDF** (print to a fitted landscape page) and **PPTX** (native, editable shapes) export what you see. Exports fetch a small library from jsDelivr the first time.

To change a chart later, ask Claude to update it. It reads the plan back out of the HTML file, including your saved edits.

## Scripts

All in `skill/gantt/scripts`, no dependencies:

| Command | Does |
| --- | --- |
| `node build.mjs plan.json [out.html]` | Validate a plan and build the chart |
| `node palette-page.mjs --title T --phases "A,B" out.html` | Build the palette chooser |
| `node csv-to-plan.mjs tasks.csv plan.json` | Convert a task list |
| `node render-png.mjs page.html out.png` | Screenshot the palette chooser or a chart (needs Playwright) |
| `node extract.mjs chart.html [plan.json]` | Read a plan back out of a chart |

The plan format is documented in [`skill/gantt/reference/plan-schema.md`](skill/gantt/reference/plan-schema.md).

## Development

```bash
npm install
```

```bash
npm test
```

The smoke test builds the example plan, drives the chart in headless Chromium (drag, resize, undo, zoom, collapse, save, PNG and PPTX export, hostile input) and writes screenshots to `test-results/`. It needs Playwright available to Node.

This repo uses [beautiful-harness](https://github.com/shachafnave/beautiful-harness) for local AI-assisted development. It is git-ignored. To set it up after cloning:

```bash
git clone https://github.com/shachafnave/beautiful-harness harness
```

```bash
harness/scripts/bootstrap.sh .
```
