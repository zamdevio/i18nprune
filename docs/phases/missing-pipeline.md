# Phase — Multi-locale pipeline from `missing` (orchestration, later)

**Status:** **planned** — **`missing`** is **shipped**; wait until report behavior is consistent across commands (see [report.md](./report.md)) and manual multi-step runs are boringly reliable — then implement as a **thin orchestration layer**, not a second translation stack.

This file is **development-only** (see repo `.gitignore` for `docs/phases/`).

---

## Intent

A **single entry point** (command or **`missing --pipeline`**) that runs the **staged** workflow end-to-end:

1. **`missing`** — ensure **source** JSON contains keys the code references (placeholders).
2. **`sync`** — align **all non-source** locale files to **source** shape.
3. **`fill`** and/or **`generate`** — populate translations per product rules (targets that need strings).

**Why later:** needs reliable **idempotency**, **dry-run across steps**, **exit codes**, and **report aggregation** from each phase. Those pieces should exist and be battle-tested first.

---

## Why this “shines” once core exists

- **No new core:** reuse **`resolveContext`**, **`translateLeaf`**, JSON merge/prune, **`exactLiteralKeys`**, **`scanSources`**, existing command implementations.
- **Safety nets:** each step can stay **observable** (logs, **`--report-file`**, **`--json`**) the same way as running commands manually; the orchestrator composes them.
- **CI:** one invocation with **`--dry-run`** can print a **preview** of the full chain without writes, if we define that contract.

---

## Design questions (before implementation)

| Topic | Notes |
|-------|--------|
| **Command name** | Top-level **`i18nprune pipeline`** vs **`missing --all`** vs **`missing run-pipeline`** — pick for clarity. |
| **Scope** | All locales under **`localesDir`** vs **`--target`** subset. |
| **Translation** | **`fill`** only vs **`generate`** for missing targets vs hybrid — product decision. |
| **Failure** | Stop on first non-zero vs **continue** with summary (dangerous for partial writes). |
| **Dry-run** | Cross-step dry-run is **hard** — may be “print plan” only for v1. |

---

## Acceptance (when we build it)

- [ ] Delegates to existing commands or shared core modules (no duplicated scan/translate).
- [ ] Documented in **`docs/commands/`** and [behavior](../behavior/commands.md).
- [ ] Tests: mock or integration with fixture repo; never duplicate **`missing`** logic.

---

## See also

- [missing.md](./missing.md) — **`missing`** command + escape hatch
- [phases README](./README.md)
- [Examples](../examples/README.md) — manual multi-step workflows today
