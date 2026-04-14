# Phase — `missing` (top-level command)

**Status:** **shipped**. **User docs:** [commands/missing](../commands/missing/README.md).

**Core:** **`computeMissingLiteralKeys`** in **`packages/cli/src/core/validate/missingLiterals.ts`** — shared with **`validate`**.

This file is **development-only** (see repo `.gitignore` for `docs/phases/`).

---

## Command shape (as implemented)

- **Top-level:** `i18nprune missing`.
- **Target:** **`--locale <code>`** → **`locales/<code>.json`**; omit → **source locale** (`config.source`).
- **Human writes:** path preview (**`--top`** / **`--full-list`** / **`config.missing`** / **`MISSING_DISPLAY_DEFAULT_TOP`**), then **Inquirer `confirm`** unless global **`--yes`**; non-interactive writes require **`--yes`** (or **`--dry-run`**).
- **`--dry-run`**, **`--from-report`**, **`--json`**, reports — implemented; **`--json`** emits full **`paths`** array.

---

## Default flow (recommended)

1. **`missing`** (default) — patch **source locale** JSON.
2. **`sync`** — non-source files match **source** shape.
3. **`fill`** — re-translate stale leaves in targets.
4. **`validate`** / **`quality`** / **`review`** as needed.

---

## Shared logic

- Same literal scan as **`validate`**; comparison file is the chosen write target.
- **`validate --json`** **`missing`** array matches **`missing`** when the write target **is** the **source locale** file; **`--from-report`** filters to current scan.

---

## Acceptance — met

- [x] **`--locale`** optional → default **source locale**; **`--locale <code>`** → **`locales/<code>.json`**.
- [x] Warning when **`--locale`** is not the **source locale** slug (where applicable).
- [x] Preconditions: missing **`localesDir`** / missing target where applicable.
- [x] Shared **`computeMissingLiteralKeys`**, **`--from-report`**, **`--dry-run`**, tests.

---

## See also

- [missing-pipeline.md](./missing-pipeline.md)
- [phases README](./README.md)
- [generate.md](./generate.md)
- [validate.md](./validate.md)
