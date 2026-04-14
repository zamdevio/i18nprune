# Architecture

**Topic map:** [Canonical topics](../CANONICAL_TOPICS.md) — one primary doc per major subject.

1. **`packages/cli/bin/cli.ts`** — Commander program, global flags, `preprocessArgv`, `preAction`.
2. **`packages/cli/src/argv/`** — Argv preprocessing (`--langs` → `languages`).
3. **`packages/cli/src/config/`** — Schema, load (TS/JS via jiti), resolve (duplicate config handling), init prompts.
4. **`packages/cli/src/core/`** — Context, JSON merge/prune, extractor, **`dynamic/`** heuristics, scanner, translator, progress, errors, **languages** catalog.
5. **`packages/cli/src/commands/`** — One folder per command; **`logger`** for output.
6. **`packages/cli/src/utils/`** — **`style`**, **`ansi`**, **`logger`**, fs, paths, rg, help.

**Data flow:** argv → **`RunOptions`** + overrides → **`resolveContext()`** → command → stdout/stderr via **`logger`**.

## Topic hubs (canonical docs)

| Topic | Where |
|-------|--------|
| **JSON / `--json`** | [JSON output (`--json`)](../json/README.md), [programmatic API & CLI JSON](../json/programmatic.md) |
| **Command vs `core` layout** | [Command orchestration boundary](../commands/orchestration/README.md), [ADR 006](./decisions/006-command-orchestrator-boundary.md) |
| **CLI prompts** | [CLI prompt modules](../cli/prompts/README.md) |
| **Translator & progress** | [Translator engine](../translator/README.md), [Translation progress](../progress/README.md) |
| **Loader & user i18n wiring** | [Loader & config](../patching/loader.md), [patching overview](../patching/README.md) |
| **Project tree** | [tree](./tree/README.md) |
| **Languages catalog** | [languages](./languages/README.md) |

## ADRs

- [ADR template](./decisions/template.md) — structure for new decision records
- [ADR 001 — v0.x scope](./decisions/001-scope-v0-1.md)
- [ADR 002 — Configurable translation calls](./decisions/002-configurable-translation-calls.md)
- [ADR 003 — User i18n loader (opt-in)](./decisions/003-user-i18n-loader-integration.md)
- [ADR 004 — Opt-in auto-patching](./decisions/004-auto-patch.md)
- [ADR 005 — Dynamic key rebuild & prefix](./decisions/005-dynamic-key-rebuild-and-prefix.md)
- [ADR 006 — Command orchestrator boundary](./decisions/006-command-orchestrator-boundary.md)
