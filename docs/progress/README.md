# Translation progress (`generate`)

Long-running translation commands draw a **live progress UI** on **standard error** so **standard output** stays free for structured **`--json`** payloads on supported commands.

## Policy (`RunOptions`)

| Flag / mode | Progress |
|-------------|----------|
| Default (TTY stderr, not silent) | **On** — multi-line bar, key path(s), wall clock / average / ETA on a TTY; compact single-line fallback when stderr is not a TTY. With **`--workers` > 1**, the pool phase uses **translate-job** counts, honest throughput, and up to five in-flight keys (see [Translation config](../config/translate.md)). |
| **`--json`** / **`run.json`** | **Off** — avoids mixing a live UI with machine-readable stdout. |
| **`-q` / `--quiet`** | **Off** — progress is treated as non-essential; use for logs with less noise. |
| **`-s` / `--silent`** | **Off** — same as quiet for the progress gate. |

Implementation uses **`canPrintProgress`** (`packages/cli/src/utils/logger/policy.ts`). See also [JSON mode & long commands](../behavior/json-long.md).

## Code layout

| Module | Role |
|--------|------|
| `packages/cli/src/shared/progress/index.ts` | Barrel: `createTranslationProgress`, session export, format helpers. |
| `packages/cli/src/shared/progress/translation.ts` | Multi-line stderr redraw (cursor-up), styled bar and labels; policy gate for quiet/json. |
| `packages/cli/src/shared/progress/format.ts` | Duration and path truncation helpers. |
| `packages/cli/src/shared/progress/session.ts` | SIGINT exit **130**, stdin handling during progress, `done` / `fail` cleanup, and post-clear cursor lift (shared for **`generate`**). |
| `packages/cli/src/shared/progress/tickRelay.ts` | **`generate`**: maps **`tickProgress`** to session UI + throttled **`run.progress.*`** translate events (same **~50-step** cadence when a run emitter is wired, e.g. **`--json`**). |
| `packages/core/src/types/progress/tick.ts` | Tick contract: **`TranslationProgressPhase`**, optional **`TranslationPoolProgressSnapshot`** (in-flight paths + job counts). |

## See also

- [generate](../commands/generate/README.md)
- [Translator engine & progress](../translator/README.md)
