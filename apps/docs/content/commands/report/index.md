# `report`

**Full examples:** [report examples](../../examples/commands/report)

Project-level report: **live scan** (missing literal keys, dynamic key sites, key observations) or **reuse** of a prior validated JSON (`--from`).

## Payload (JSON / embedded HTML)

The **`i18nprune.projectReport`** document includes:

- **`summary`** — counts (`missingKeysCount`, `dynamicSitesCount`, `keyObservationsCount`, `ok`), plus optional **`sourceFilesScannedCount`** (files under `project.srcRoot` included in key-site and dynamic scans).
- **`details`** — full arrays: **`missingKeys`**, **`dynamicSites`**, **`keyObservations`** (scanner objects as produced by the core extractors; no row cap in the CLI writer).
- **`project`** — paths (`cwd`, `sourceLocalePath`, `localesDir`, `srcRoot`, …) and optional **`environment`** for stable editor links in the HTML UI.

Path semantics (casing, duplicate paths in arrays): see [Report UI — Filesystem paths](../report#filesystem-paths-casing-and-duplicate-files).

## Formats

| Format | Description |
|--------|-------------|
| **`html`** (default) | Single **offline** file embedding the [Report UI](../report) (React SPA). |
| **`json`** | Machine-readable `i18nprune.projectReport` document (pretty-printed with trailing newline). |
| **`csv`** | Row-per-section export (`meta`, `project`, `summary`, `missingKeys`, `dynamicSites`, `keyObservations`). |
| **`text`** | Short human summary (paths + counts + optional source-files line). |

## Options

| Option | Description |
| ------ | ----------- |
| `--format <fmt>` | `html` (default), `json`, `csv`, or `text` |
| `--out <path>` | Output file (default: `report-<local-timestamp>.<ext>` in cwd) |
| `--from <file>` | Load a prior **`i18nprune.projectReport`** JSON (schema-validated) and re-export in the chosen format **without scanning** |

## Usage

```bash
# Default: timestamped HTML in cwd
i18nprune report

i18nprune report --format json --out ./out/project-report.json
i18nprune report --format html --out ./out/report.html
i18nprune report --from ./out/project-report.json --format text --out ./summary.txt
```

## Quick demo (portable HTML audit report)

```bash
i18nprune report --format html --out ./out/report.html
# open ./out/report.html in any browser (fully offline)
```

## Global `--json`

With **`i18nprune --json report …`**, the CLI still writes the **file** chosen by **`--format`** and **`--out`** (same as without **`--json`**), and also prints **one `CliJsonEnvelope`** on stdout (`kind`: **`report`**). Payload: **`types/command/report/json.ts`** — **`format`**, **`outputPath`** (resolved path or **`null`** if the write was skipped), and **`document`** (the full **`i18nprune.projectReport`** object, same as **`report --format json`** file contents).

Use **`--format json`** when you want a **JSON file** on disk; use global **`--json`** when you want the **stdout envelope** for CI (you can combine both).

Headless: **`runReport(opts)`** from **`i18nprune/core`** (async).

## HTML output requirements

The npm package ships **`dist/report/index.html`** next to **`dist/cli.js`**. **`pnpm build`** (or `pnpm build:report`) must run so that path exists before `report --format html` can bundle the UI.

Embedded payload development details, routing, and SPA patterns: **[Report UI documentation](../report)**.

### Existing output paths (`report --out`)

If the resolved target file **already exists**:

- **Interactive TTY** (not CI, not headless): i18nprune **prompts** — **Overwrite**, **Keep both** (new sibling path with a random **8-char hex** suffix before the extension), or **Skip** (no write).
- **Automation** — no prompt; behavior matches **Keep both** when any of these hold: **`CI`**, non-TTY / **`shouldSkipInteractivePrompts()`**, global **`--yes`**, or global **`--json`**. That keeps **`i18nprune report … --json`** and piped CI from blocking on Inquirer or closing stdin (which previously surfaced as **`i18nprune.io.read_failed`**).

For non-`report` commands, use global **`--json`** and shell redirection when you want a file artifact (for example `i18nprune validate --json > ./out/validate.json`).

## See also

- [CLI overview](../cli)
- [Report UI (embedded SPA)](../report)
