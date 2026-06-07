# Quiet, silent, and JSON output

Global flags are stored in **`RunOptions`** (`packages/cli/src/types/core/runtime/index.ts`) and set from **`packages/cli/bin/cli.ts`**:

- **`--json`** — Machine-readable mode where implemented.
- **`-q` / `--quiet`** — Fewer human-oriented messages; **banner stays on** (unless JSON).
- **`-s` / `--silent`** — Stricter; implies **`quiet`** for log gates and **hides the top banner**; **errors still print**.

Implementation policy lives in **`packages/cli/src/utils/logger/policy.ts`**. Prefer these predicates:

| Gate / predicate | Quiet (`-q`) | Silent (`-s`) | JSON (`--json`) |
|------------------|-------------|---------------|-----------------|
| **`canPrintCommandBanner`** (boxed header) | on | **off** | off |
| **`canPrintDecorative`** (dim hints, extra blanks) | **off** | off | off |
| **`canPrintInfo`** | **off** | off | off |
| **`canPrintWarn`** | on | **off** | off |
| **`canPrintDetail`** | **off** | off | off |
| **`canPrintPrimary`** (lists, “Wrote …”) | on | **off** | off |
| **`canPrintProgress`** | **off** | off | off |

Rough mapping:

| Predicate | Use |
|-----------|-----|
| `isJsonMode` | Structured JSON on stdout |
| `canPrintDecorative` | Headers, dim hints, extra blank lines |
| `canPrintInfo` | `[i18nprune] [info]` lines |
| `canPrintWarn` | `[i18nprune] [warn]` (still **on** in quiet; **off** in silent) |
| `canPrintDetail` | Dim / secondary prose |
| `canPrintPrimary` | Numbered lists, tables, “Wrote …” lines |
| `canPrintProgress` | TTY stderr progress |

All user-facing stdout should go through **`logger`** (`packages/cli/src/utils/logger/index.ts`). Pass **`ctx.run`** (or use **`loggerFor(ctx.run)`**) so suppression matches the active command context. Optional per-call **`mask`** (`Partial<RunOptions>`) merges on top for rare overrides.

**Errors** always use **`logger.err`** (stderr).

## `version` subcommand and `-s`

Use **`i18nprune version`** (or global **`-V`**) for semver output and update checks. `-v` is available for command-level verbose aliases (for example, `share view -v`).

A few code paths still use **`console.log`** for the bare semver (e.g. plain **`version`** with no **`--check`**); they intentionally bypass the logger so scripts get a single line even when flags are odd. Prefer **`logger`** for new human-oriented output.

## Design note: should `-s` silence *everything*?

**Today:** **`-s`** is “CI-ish human mode”: hide banner and non-error chatter, but **still show errors** (and **`doctor`**-style failures on stderr) so failures are visible without a TTY.

**Fully silent** (no stderr unless `--json`) would be easy to misuse: failed runs would exit non-zero with no visible reason in logs. If we ever add **`--quiet-errors`** or a **`NO_COLOR`+silent combo**, it should be explicit.

**`-q`** is the middle ground: keep **warnings** and **primary** output for monitoring, drop **info** / **decorative** noise.

### `version --check` and `-s`

**`i18nprune version --check`** is only useful if you see whether the registry was reached. Global **`-s`** would otherwise hide **`warn`** / **`plain`** lines and produce an empty run with no signal. That command therefore passes a per-call **`{ silent: false }`** mask on its check result lines (fetch failure, current vs latest, upgrade hint). The **top banner** stays off in **`-s`** (banner gate unchanged). Other commands (e.g. **`doctor -s`**) keep **warnings** suppressed so you still get **errors-only** there unless we revisit that policy globally.

## Practical tips

- **CI / automation:** prefer **`--json`** for stable output.
- **Quiet vs silent:** **Quiet** keeps warnings and **primary** human output. **Silent** drops warnings and primary human output unless **`--json`** applies.
- **Plain / grep-friendly human lines:** see [Log presentation](./output.md) (`--no-color`, `NO_COLOR`, `--no-log-prefix`, `--no-log-channel`). Presentation flags do not change content gates above.

## Adding a new command

1. Use **`logger`**, **`canPrint*`**, or **`canEmit`** — avoid raw **`console.log`** for user-facing text.
2. For JSON mode, skip human branches; prefer **one** primary JSON document. Do **not** call **`printCommandSummary`** on the JSON path (it would emit an extra **`kind: summary`** line). **`cleanup --json`** embeds timing under **`data.summary`** in the primary envelope instead.
