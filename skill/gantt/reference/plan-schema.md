# Plan file format

One JSON file describes a plan. `scripts/build.mjs` validates it and renders it.

```json
{
  "title": "Checkout v2",
  "subtitle": "Payments squad roadmap | Q1 2027",
  "org": "Acme Payments",
  "logo": "./acme-logo.png",
  "palette": "bloom",
  "today": "2026-11-21",
  "zoom": "week",
  "showDependencies": true,
  "phases": [
    { "name": "Discovery", "color": "#e5487f", "tasks": [
      { "id": "t1", "name": "Funnel analysis", "owner": "NL", "start": "2026-11-02", "end": "2026-11-12", "pct": 100 },
      { "id": "m1", "name": "Framing signed off", "milestone": true, "start": "2026-11-20", "deps": ["t1"] }
    ]}
  ]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Plan name, shown in the header and used for file names. |
| `subtitle` | no | One line under the title: team, range, cadence. |
| `org` | no | Organization name, shown small above the title. |
| `logo` | no | Local path (relative to the JSON file), URL, or data URI. Build inlines local files. |
| `palette` | no | `bloom`, `harbor`, `studio`, `citrus`, `ink`, or `{"name":"Brand","colors":["#hex",...],"today":"#hex"}`. Default `bloom`. |
| `today` | no | Pin the Today line (YYYY-MM-DD). Omit to use the viewer's current date. |
| `start`, `end` | no | Force the visible range. Otherwise it is the task range plus padding. |
| `zoom` | no | Initial zoom: `day`, `week`, `month`, `quarter` (Fit). Default `week`. |
| `showDependencies` | no | Initial state of the Dependencies toggle. Default `true`. |
| `phases[].name` | yes | Phase, epic, or workstream. One card each, in order. |
| `phases[].color` | no | Override the palette for this phase. |
| `tasks[].id` | no | Stable id, used by `deps`. Generated if missing. |
| `tasks[].name` | yes | Task name. |
| `tasks[].owner` | no | Initials or short name. Keep it under 4 characters for the column. |
| `tasks[].start` | yes for a bar | YYYY-MM-DD. |
| `tasks[].end` | no | YYYY-MM-DD, inclusive. Defaults to `start` (one day). |
| `tasks[].pct` | no | 0 to 100. |
| `tasks[].status` | no | Override the computed status label. Computed: Done (100%), Overdue (end passed), On-going (started), Upcoming. |
| `tasks[].deps` | no | Ids this task waits on. Drawn as arrows from their end to this start. |
| `tasks[].milestone` | no | `true` draws a diamond at `start`. `done: true` fills it. |

## Mapping from other tools

| Source | phase | name | owner | start | end | pct | deps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Jira | Epic name (or Sprint) | Summary | Assignee initials | Start date (or sprint start) | Due date (or sprint end) | Done = 100, In progress = 50 unless story points say otherwise | "is blocked by" links |
| monday.com | Group | Item name | Person column | Timeline start | Timeline end | Status (Done = 100) or Progress column | Dependency column |
| Linear | Project or Cycle | Issue title | Assignee | Start or cycle start | Due date or cycle end | Completed = 100, Started = 50 | "blocked by" relations |
| CSV / Excel | phase | task | owner | start | end | progress | depends_on |
