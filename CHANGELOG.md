# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-11-21

### Added

- Works in Codex and Cursor as well as Claude Code. `install.sh` installs for every supported agent, or one with `claude`, `codex` or `cursor`; `--project` installs into the current project and `--uninstall` removes it.
- `.agents/skills/gantt` is committed, so Codex and Cursor pick the skill up inside this repo.

### Changed

- `SKILL.md` instructions are agent-neutral: choice prompts and inline images fall back to plain text and the OS opener where an agent lacks them.

### Fixed

- A broken table row in `SKILL.md` that ran into the Scripts section.

## [1.0.0] - 2026-11-21

First public release.

### Added

- `/gantt` skill for Claude Code with a mandatory interview: source, titles (chart, subtitle, every group), gaps, branding, palette, and a go-ahead before building.
- Sources: interview, pasted text or documents, CSV, Excel (converted to CSV), and Jira, monday.com or Linear through their connectors.
- Palette chooser rendered as an image in the chat, with five built-in palettes, one pulled from your logo, or custom hex codes.
- Attached logos are embedded in the chart header, presenter slides and PPTX.
- Self-contained HTML chart: phase cards, status pills, milestones, dependency arrows, Today line, Day/Week/Month/Fit zoom, collapsible groups.
- Drag to move and resize tasks, undo, and Save to a new file with edits embedded.
- Presenter mode: full-screen 16:9 overview, one slide per group, milestones.
- Exports: PNG, PDF (print to a fitted landscape page) and PPTX with the same slides as presenter mode, as native editable shapes.
- Scripts: build, palette page, CSV import, plan extraction, PNG rendering.
- End-to-end smoke tests in headless Chromium.
