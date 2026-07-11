---
description: Read-only audit reports for dynamic key sites, source-identical leaves, combined honest signals, baselines, and PR markdown.
---

# `kits`

Read-only **audit reports** for CI and maintainer workflows. Uses the same project discovery as other commands — global **`-c/--config`** only (no `--cwd`).

| Subcommand | Role |
|------------|------|
| **[`kits dynamic`](./dynamic.md)** | List non-literal translation call sites (`runDynamic`). |
| **[`kits identical`](./identical.md)** | Source-identical leaf paths per locale file. |
| **[`kits honest`](./honest.md)** | Combined validate + dynamic + quality + review signal. |
| **[`kits baseline`](./baseline.md)** | Snapshot counts with optional baseline delta. |
| **[`kits pr`](./pr.md)** | PR-style markdown summary for CI comments. |

```bash
i18nprune kits --help
i18nprune help kits dynamic
```

## Global flags

| Flag | Short | Notes |
|------|-------|-------|
| `--json` | `-j` | Standard `CliJsonEnvelope` on stdout (pretty by default; `-jp false` for minified). |
| `--json-pretty` | `-jp` | Pretty-print when `-j` is on (default `true`). |
| `--top` | `-T` | List window for terminal **and** `-sb` saves. |
| `--full` | `-F` | Full list mode (bounded by core cap). |

Project root comes from your config file path — same as `validate`, `quality`, etc.

## Shared kits flags

| Flag | Short | Description |
|------|-------|-------------|
| `--target` | `-t` | Optional locale filter |
| `--out` | `-o` | Write output to file |
| `--fail-on` | `-fon` | Policy gates: `issues`, `dynamic`, `missing`, `source-identical` |
| `--max-dynamic` | `-mxdy` | Exit 2 when dynamic site count exceeds *n* |
| `--baseline` | `-b` | Compare against a saved JSON baseline (project-relative) |
| `--save-baseline` | `-sb` | Save terminal-matching report (`.md` default; `-j` → `.json`) |

Baseline paths are **relative to the project root** (not a global kit directory).

## Dynamic-key honesty

Kits never imply that `validate ok` means every dynamic prefix has locale strings. See [dynamic key sites](../../issues/validate.md#dynamic-key-sites).

## Terminal output

Markdown subcommands (`kits pr`, `kits honest`, `kits baseline`, …) print layered contrast when stdout is a TTY:

| Line kind | Treatment |
|-----------|-----------|
| `##` / `###` headings | Primary (full brightness) |
| Bullet metrics (`- Missing …`) | Primary |
| Blockquotes `>` | Dim |
| `Docs:` / `Note:` footnotes | Dim |
| Dynamic sample rows | `[kind]` primary; path/preview suffix dim |

`--out path.md` and `--json` stay plain markdown/JSON with **no ANSI**. Use `-o` for CI artifacts; use terminal output for local triage.

## Examples

```bash
i18nprune kits dynamic -F -j
i18nprune kits honest --strict -sb .i18n-baseline.md
i18nprune kits pr --focus settings -T 10 -o /tmp/pr.md
```

## See also

- [`locales dynamic`](../locales/dynamic.md) — same dynamic model, envelope JSON
- [CLI overview](../../cli/README.md)
