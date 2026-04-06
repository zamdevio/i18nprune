# `report`

Top-level **help topic** only: it does **not** write files or change your project. It loads the same config and context as other commands so paths stay consistent.

## Purpose

Documents **global** **`--report-file <path>`** and **`--report-format <json|text|csv>`** (see **`bin/cli.ts`** root options). Supported commands push entries through **`utils/report`** and write **one artifact** at end of run (counts, command-specific data). Default format: **`config.reportFormat`**, else **`json`**.

**`help`** shows usage as **`i18nprune <command> [options] [--report-file …]`** — not **`i18nprune report [options]`** — because **`report`** is a guide, not the flag host.

## Usage

```bash
i18nprune report
i18nprune report --help
i18nprune help report
i18nprune sync --report-file ./out/report.json
i18nprune fill --lang all --report-file ./out/fill.txt --report-format text
```

Respects global **`--json`**, **`-q` / `--quiet`**, **`-s` / `--silent`** like other commands (human body is suppressed when decorative output is off).

## See also

- [Roadmap](../../roadmap/README.md)
- [CLI overview](../../cli/README.md)
