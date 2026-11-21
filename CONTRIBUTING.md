# Contributing

Thanks for helping. Bug reports, palette ideas, and fixes are all welcome.

## Before you start

- For anything bigger than a small fix, open an issue first so we can agree on the approach.
- Keep the generated chart a single, self-contained HTML file. New runtime dependencies are a hard sell; the export libraries are loaded lazily from a pinned CDN URL for that reason.
- The skill scripts in `skill/gantt/scripts` must stay dependency-free (Node 18+ standard library only).

## Setup

```bash
npm install
```

The tests need Playwright with Chromium. If you don't have it:

```bash
npm install --no-save playwright && npx playwright install chromium
```

## Checks

```bash
npm test
```

The smoke test builds the example plan, drives the chart in headless Chromium (drag, resize, undo, zoom, collapse, save, presenter mode, PNG and PPTX export, hostile input) and writes screenshots to `test-results/`. Look at them when you change anything visual.

If you change the look of the chart, refresh the README images with `npm run screenshots`.

## Pull requests

- One topic per pull request, with a short description of what changed and how you checked it.
- Add or update a test in `tests/smoke.mjs` for behavior changes.
- Update `CHANGELOG.md` under an "Unreleased" heading.
- User-facing text: plain words, no em dashes.
