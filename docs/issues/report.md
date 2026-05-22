# Report — issue codes (`i18nprune.report.*`)

[← Issue codes index](./README.md)

## `invalid_format`

**Severity:** `error`  
**When:** **`report`** receives an invalid **`--format`** value (anything outside `html`, `json`, `csv`, `text`).  
**Who:** **`report`** command argument parsing path. In **`--json`** mode, this is emitted inside a `CliJsonEnvelope` with this issue code instead of logger-only text.  
**What to do:** Pass a supported value, for example `--format json`.

## `hosted_report_invalid`

**Code:** `i18nprune.report.hosted_report_invalid`  
**Severity:** `error`  
**When:** Primary `POST /v1/reports` ingest body is not a JSON object, is missing `document`, or nested validation failed before schema check.  
**Who:** `validateHostedReportIngestBody` (`packages/core/src/project/validate/hostedReport.ts`).  
**What to do:** POST `{ "document": <ProjectReportDocument> }`; run `i18nprune report --format json` or `prepareReportForShare` on the host first.
