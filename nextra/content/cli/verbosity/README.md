# Quiet, silent, and JSON output

Global flags are stored in **`RunOptions`** (`src/types/core/runtime/index.ts`) and set from **`bin/cli.ts`**:

- **`--json`** — Machine-readable mode where implemented.
- **`-q` / `--quiet`** — Fewer human-oriented messages.
- **`-s` / `--silent`** — Stricter; implies quiet-like behaviour for logs and hides most human stdout unless you use **`--json`**.

Implementation policy lives in **`src/utils/logger/policy.ts`**. Prefer these predicates:

| Predicate | Use |
|-----------|-----|
| `isJsonMode` | Structured JSON on stdout |
| `canPrintDecorative` | Headers, dim hints, extra blank lines |
| `canPrintInfo` | `[i18nprune] [info]` lines |
| `canPrintWarn` | `[i18nprune] [warn]` (still **on** in quiet; **off** in silent) |
| `canPrintDetail` | Dim / secondary prose |
| `canPrintPrimary` | Numbered lists, tables, “Wrote …” lines |
| `canPrintProgress` | TTY stderr progress |

All user-facing stdout should go through **`logger`** (`src/utils/logger/index.ts`). Pass **`ctx.run`** (or use **`loggerFor(ctx.run)`**) so suppression matches the active command context. Optional per-call **`mask`** (`Partial<RunOptions>`) merges on top for rare overrides.

**Errors** always use **`logger.err`** (stderr).

## Practical tips

- **CI / automation:** prefer **`--json`** for stable output.
- **Quiet vs silent:** **Quiet** keeps warnings and **primary** human output. **Silent** drops warnings and primary human output unless **`--json`** applies.

## Adding a new command

1. Use **`logger`**, **`canPrint*`**, or **`canEmit`** — avoid raw **`console.log`** for user-facing text.
2. For JSON mode, print **one** JSON document to stdout and skip human branches (avoid chaining **`printCommandSummary`** in `--json` mode if it would emit a second JSON line).
