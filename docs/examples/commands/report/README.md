# Report Examples

## Generate artifacts

```bash
i18nprune report
i18nprune report --format json --out ./out/report.json
i18nprune report --format csv --out ./out/report.csv
```

## Re-render from saved JSON

```bash
i18nprune report --from ./out/report.json --format html --out ./out/report.html
```

## Timing

```bash
time i18nprune report --format json --out /tmp/i18nprune-report.json
```

## Global flag coverage

```bash
# global --json still emits envelope (separate from --format payload file)
i18nprune --json report --format json --out ./out/project-report.json --json-pretty false

# plus global report artifact for command-run trace
i18nprune stdout redirection ./out/report-command-run.txt --format text report --format html --out ./out/project-report.html
```
