# Translation progress (`generate` / `fill`)

Long-running translation commands draw a **live progress UI** on **standard error** so **standard output** stays free for structured **`--json`** payloads on supported commands.

## Policy (`RunOptions`)

| Flag / mode | Progress |
|-------------|----------|
| Default (TTY stderr, not silent) | **On** — multi-line bar, current JSON key path, wall clock / average per leaf / ETA on a TTY; compact single-line fallback when stderr is not a TTY. |
| **`--json`** / **`run.json`** | **Off** — avoids mixing a live UI with machine-readable stdout. |
| **`-q` / `--quiet`** | **Off** — progress is treated as non-essential; use for logs with less noise. |
| **`-s` / `--silent`** | **Off** — same as quiet for the progress gate. |

Implementation uses **`canPrintProgress`** (`src/utils/logger/policy.ts`). See also [JSON mode & long commands](../behavior/json-long.md).

## Code layout

| Module | Role |
|--------|------|
| `src/core/progress/index.ts` | `createTranslationProgress` — applies policy, then rich or minimal renderer. |
| `src/core/progress/translation.ts` | Multi-line stderr redraw (cursor-up), styled bar and labels. |
| `src/core/progress/format.ts` | Duration and path truncation helpers. |
| `src/core/progress/session.ts` | SIGINT exit **130**, stdin handling during progress, `done` / `fail` cleanup. |

## See also

- [generate](../commands/generate/README.md) · [fill](../commands/fill/README.md)
- [Translator engine & progress](../architecture/translator-and-progress.md)
