# `report`

Build project reports from a fresh scan or from an existing report document, then export in `html`, `json`, `csv`, or `text`.

## When to use

- Generate a shareable snapshot for product/localization review.
- Export machine-readable report docs for CI or downstream tooling.
- Re-render HTML from a previously saved JSON report without rescanning code.

## Formats

- `html` (default)
- `json`
- `csv`
- `text`

## Usage

```bash
i18nprune report
i18nprune report --format json --out ./out/report.json
i18nprune report --from ./out/report.json --format html --out ./out/report.html
```

## Core behavior

`report` has two JSON surfaces that serve different consumers:

- `--format json` writes an on-disk project report document (`kind: "i18nprune.projectReport"`).
- global `--json` emits CLI envelope on stdout (`kind: "report"`, `data.document`, `data.outputPath`, `data.format`).

The project report payload includes:

- `kind`, `schemaVersion`
- `generatedAt`, `toolVersion`
- `project` (`cwd`, source/locales/src paths)
- `summary` (`ok`, missing/dynamic counts)
- `details` (`missingKeys`, `dynamicSites`, `keyObservations`)

## jq usage (`--json` + report documents)

```bash
# Read top-level summary from generated report document
i18nprune report --format json --out ./out/report.json
jq '{ok: .summary.ok, missing: .summary.missingKeysCount, dynamic: .summary.dynamicSitesCount}' ./out/report.json

# Query stdout envelope in one command
i18nprune report --format json --json \
  | jq '{format: .data.format, outputPath: .data.outputPath, summary: .data.document.summary}'

# List files with highest missing-key counts from report document
jq '.details.missingKeys
  | group_by(.file)
  | map({file: .[0].file, missingCount: length})
  | sort_by(-.missingCount)
  | .[:10]' ./out/report.json

# Extract dynamic key sites with source location hints
i18nprune report --format json --json \
  | jq '.data.document.details.dynamicSites[]? | {
      key: (.key // null),
      file: (.file // null),
      line: (.line // null)
    }'
```

## Troubleshooting

- Empty or small output often means source/locales paths in config are not the intended project paths.
- If downstream tooling expects stdout JSON, use global `--json`; `--format json` writes file output instead.
- Re-render workflows should use `--from` with a valid report document of kind `i18nprune.projectReport`.

## Related

- [report UI docs](../report/README.md)
- [Report issues](../issues/report.md)
- [jq cookbook](../examples/jq-cookbook.md)
