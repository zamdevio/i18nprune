# Project report payload (`i18nprune.projectReport`)

The HTML report UI and `i18nprune report --format json` share one **JSON document** shape. The CLI embeds it in generated HTML under `<script type="application/json" id="i18nprune-inline-payload">`; the standalone report SPA (`apps/report`) reads that script, or you can **paste / load** the same JSON manually.

## Kind and version

| Field | Value |
|-------|--------|
| `kind` | Must be exactly `i18nprune.projectReport` (`PROJECT_REPORT_KIND` in `@i18nprune/report`). |
| `schemaVersion` | Integer; must match `PROJECT_REPORT_SCHEMA_VERSION` baked into the report UI build (see `packages/report`). |

If `schemaVersion` does not match, the viewer shows a **version mismatch** error with upgrade/downgrade hints — regenerate with a CLI that matches the UI, or use `i18nprune report --from report.json --format html` to align JSON and HTML.

## Top-level shape (summary)

The authoritative schema is **`projectReportDocumentSchema`** (Zod) in **`packages/report`** — re-exported as `@i18nprune/report`.

Rough structure:

- `generatedAt`, `toolVersion` — provenance strings.
- `project` — `cwd`, paths (`sourceLocalePath`, `localesDir`, `srcRoot`), optional `environment`.
- `summary` — counts (`missingKeysCount`, `dynamicSitesCount`, …) and `ok`.
- `details` — `missingKeys`, `dynamicSites`, `keyObservations` arrays (exact element types in schema/types).

Do not hand-edit JSON for production workflows; use **`i18nprune report --format json`** (or `--format html` with embedded payload).

## Manual load in the report SPA

The report app supports **paste** and **file pick**. Validation uses the same Zod schema as the CLI `--from` path: invalid JSON, wrong `kind`, or version skew produce **clear, field-level** messages.

## Live demo

A static demo of the report UI can be hosted separately (for example `https://report.i18nprune.dev`, Cloudflare Pages project `report-i18nprune`) with the same build as the HTML bundle shipped in the CLI. **Any** JSON that validates — including a large real-project report — is appropriate for the demo as long as the payload matches the current `schemaVersion`; a smaller fixture is optional if you want faster loads.

## See also

- [Report UI (embedded SPA)](.)
- [Report command](../commands/report)
- Source: `packages/report/README.md`
