# Phase — Report system (`report` command + global `--report-file`)

**Status:** **Shipped — phase closed** for the main deliverable (dedicated **`report`** command + embedded HTML SPA + DTO). **Residual work** is tracked only in [Follow-ups](#follow-ups-non-blocking) below; pick these up whenever convenient.

This file is **development-only** (see repo `.gitignore` for `docs/phases/`).

---

## Phase closure (what “done” means here)

The **report** workstream is **closed** for product purposes:

- Users can rely on **`i18nprune report`** (`html` / `json` / `csv` / `text`), **`--from`**, and the offline **Report UI** as documented in [`docs/commands/report`](../commands/report/README.md) and [`docs/report`](../report/README.md).
- Global **`--report-file`** on other commands remains **`json|text|csv`** only (by design); HTML stays on **`report --format html`** only.

Anything listed under **Follow-ups** is **optional** polish or parity audits — not required to call this phase finished.

---

## Scope split (locked direction)

### A) Global `--report-file` / `--report-format` (on regular commands)

- Per-command artifact at the end of a run.
- Formats: **`json` | `text` | `csv`** only (no HTML on this path).
- Wired through config default **`reportFormat`** and CLI overrides.

### B) Dedicated `i18nprune report` command

- Project-level scan → **`i18nprune.projectReport`** DTO, schema-versioned.
- **`--format`**: **`html` | `json` | `csv` | `text`**; **`--out`**; **`--from`** prior JSON (Zod-validated).
- **`--json`** rejected with guidance to **`--format json`**.
- **`html`**: single-file embedded React SPA + inline JSON payload (`src/spa/report/`).

---

## Shipped acceptance (report command)

- [x] `report` supports `--format html|json|csv|text` + `--out` + `--from` with schema validation.
- [x] `report --format json` emits versioned **`i18nprune.projectReport`** (full detail lists, summary fields including optional **`sourceFilesScannedCount`**).
- [x] `report --format text` / **`csv`** emit from the same document.
- [x] `report --format html` bundles the SPA; default timestamped artifact when `--out` omitted.
- [x] Clear error when `report --json` is used (`--format json` documented).

### Global `--report-file` (non-report commands)

- [x] **`--report-format`** supports **`json|text|csv`** only (no HTML).

---

## Follow-ups (non-blocking)

All tracked follow-ups for this phase are completed.

- [x] **Global `--report-file` parity** — wired `finalizeReportFile` / report entries across remaining runtime commands so global report artifacts are consistently emitted when requested.
- [x] **Theme dropdown + viewport** — dropdown placement now auto-flips by available viewport space (up/down + left/right), while rows still explicitly support drop-up behavior.
- [x] **Regression budget** — ran **`pnpm typecheck`**, **`pnpm build`**, and **`pnpm test`** after the follow-up changes.

No open report-phase follow-ups remain in this doc.

---

## See also

- [phases README](./README.md)
- [Report UI (SPA)](../report/README.md)
- [`report` command](../commands/report/README.md)
- [key-sites.md](./key-sites.md) (observations feed the report DTO)
