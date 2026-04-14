# Phase — `fill`

**Status:** **Completed** — parity with **`generate`** on translation pipeline, **`--json`** envelope (**`kind`: `fill`**), per-target **`targetResults[]`** with **`progress`** (**`TargetProgressSummary`**), and CepatEdge-style **identity streak** guard (**`--yes`** / **`--json`** rules match **`generate`**).

**User docs:** [commands/fill](../commands/fill/README.md), [translator](../translator/README.md), [issue codes](../json/issue-codes.md) (`i18nprune.translate.identity_streak_*`, `i18nprune.fill.usage`).

**Related phase:** [generate.md](./generate.md) (shared design and progress types).

This file is **development-only** (see repo `.gitignore` for `docs/phases/`).

---

## Shipped (this phase)

| Area | Notes |
|------|--------|
| **Multi-target / `--all`** | Same catalog and source-locale rules as **`generate`**. |
| **JSON** | One **`CliJsonEnvelope`**; typed payload in **`packages/cli/src/types/command/fill/json.ts`**. |
| **Per-target progress** | **`data.targetResults[].progress`** aligned with **`generate`**. |
| **Identity streak** | Shared **`translateLeaf`** path + **`createIdentityStreakGuard`**; stable **`issues[]`** codes. |

---

## See also

- [phases README](./README.md)
- [phases README](./README.md)
- [quality](../commands/quality/README.md) — English-identical / parity context
