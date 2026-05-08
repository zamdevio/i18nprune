# Translator engine & progress (design)

This document aligns **how translation runs** in i18nprune: **provider abstraction**, **shared leaf pipeline** (`translateLeaf`), **stderr progress** + **SIGINT**, and how **`generate`** / **`fill`** behave with **flags**, **errors**, and **non-interactive** runs.

Live progress behaviour and flags are documented in **[Translation progress](../progress)**.

---

## 1. Layers (today)

| Layer | Role | Main paths |
|-------|------|------------|
| **Provider** | HTTP/API: `translate(text, sourceLang, targetLang) → Promise<string>` | `packages/cli/src/providers/google/`, `createTranslator()` in `packages/cli/src/core/translator/init.ts` |
| **Leaf pipeline** | Placeholders: mask → translate → restore → validate; **3 retries** with backoff | `packages/cli/src/core/translator/index.ts` (`translateLeaf`) |
| **Types** | `Translator`, `TranslateRequest` (request shape for future use) | `packages/cli/src/types/core/translator/index.ts` |
| **Progress** | TTY **stderr** multi-line or single-line `tick` / `done` / `fail`; **no-op** when JSON / quiet / silent | `packages/cli/src/core/progress/index.ts`, `translation.ts`, `session.ts` |
| **Session** | SIGINT → exit **130**, stdin discard during progress | `packages/cli/src/core/progress/session.ts` (`createSessionProgress`) |
| **Logger policy** | `canPrintProgress`, `canPrintInfo`, … | `packages/cli/src/utils/logger/policy.ts` |

**Rule:** Anything that draws **live** progress must respect **`canPrintProgress(run)`** (and **no** live progress on **`run.json`**).

---

## 2. Target shape (central “engine”)

The codebase already has a **single** `translateLeaf` entry point. The **next** tightening steps (not all done yet):

1. **Stable errors** — Map provider failures (`fetch`, 4xx/5xx, malformed JSON) to **`I18nPruneError`** (or a small **`TranslatorError`** subclass) with `code` / `cause`, so **`generate`** / **`fill`** can surface **one** consistent pattern (retry exhausted → message + optional hint).
2. **Edge cases** — Empty string, overlong text, rate limits: classify in **one** place (provider or thin wrapper), not in each command.
3. **Optional `@types`** — Keep **`packages/cli/src/types/core/translator`** as the single contract; add **`TranslatorResult`** / **`TranslatorFailure`** only if we need discriminated unions for **`--json`** summaries.
4. **Future providers** — `createTranslator()` (or env-based factory) chooses implementation; **commands** never import `google` directly.

---

## 3. Progress (implementation summary)

- **Stream:** **stderr** only, so **`stdout`** can emit a single JSON document when **`--json`** is on.
- **TTY:** Multi-line block (bar + key path + timing) redrawn in place; **non-TTY stderr** uses a single updating line.
- **Hidden when:** **`--json`**, **`-q`**, **`-s`**, or policy says no progress — see [progress](../progress).

---

## 4. Data flow: `generate`

1. **Argv** → global **`RunOptions`** + **`mergeGenerateOptionsFromEnv`**.
2. **`--lang`** — required if prompts are skipped (`canPromptGenerate`); else **catalog** validation + meta defaults.
3. **Loop** — preserve / parity / dry-run / translate branches; **`session.progress.tick`** for each leaf.
4. **Writes** — `writeJsonFile` target + optional `.meta.json`.
5. **Failure** — `translateLeaf` throws → command exits via **`reportCliError`** (ensure **`session.fail()`** on error paths).

---

## 5. Data flow: `fill`

1. **`--lang`** — prompt or flag; **catalog** validation; **not** the source locale.
2. **Source vs target** — only leaves where **target value still equals source** are re-translated (respect parity policy).
3. **Progress** — same **`createSessionProgress`** contract as **`generate`**.
4. **Failure** — same as **`generate`**: translate errors → non-zero exit.

---

## 6. See also

- [Translation progress](../progress)
- [Command behaviors index](../behavior/commands.md)
- [Exit codes & behavior](../behavior)
- [JSON mode & long commands](../behavior/json-long.md)
- [Roadmap](../roadmap) — reporting (`stdout redirection`).
