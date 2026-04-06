# Architecture

1. **`bin/cli.ts`** — Commander program, global flags, `preprocessArgv`, `preAction`.
2. **`src/cli/`** — Argv preprocessing (`--langs` → `languages`).
3. **`src/config/`** — Schema, load (TS/JS via jiti), resolve (duplicate config handling), init prompts.
4. **`src/core/`** — Context, JSON merge/prune, extractor, **`dynamic/`** heuristics, scanner, translator, progress, errors, **languages** catalog.
5. **`src/commands/`** — One folder per command; **`logger`** for output.
6. **`src/utils/`** — **`style`**, **`ansi`**, **`logger`**, fs, paths, rg, help.

**Data flow:** argv → **`RunOptions`** + overrides → **`resolveContext()`** → command → stdout/stderr via **`logger`**.

## See also

- [ADR template](./decisions/template.md) — structure for new decision records
- [Translator engine & progress](./translator-and-progress.md) — providers, `translateLeaf`, session progress, `generate` / `fill`
- [Translation progress](../progress/README.md) — stderr UI, flags, file map
- [Project tree](./tree/README.md)
- [Languages catalog](./languages/README.md)
- [ADR 001 — v0.x scope](./decisions/001-scope-v0-1.md)
- [ADR 002 — Configurable translation calls](./decisions/002-configurable-translation-calls.md)
- [ADR 003 — User i18n loader (opt-in)](./decisions/003-user-i18n-loader-integration.md)
- [ADR 004 — Opt-in auto-patching](./decisions/004-auto-patch.md)
- [Patching (user guide)](../patching/README.md)
- [i18n loader & config plan](./i18n-loader-and-config-plan.md) (user-project integration)
