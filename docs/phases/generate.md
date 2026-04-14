# Phase — Generate

**Status:** **Completed** (foundations + per-target **`targetResults[].progress`** + identity-streak guard shared with **`fill`**). **User docs:** [commands/generate](../commands/generate/README.md), [behavior / JSON](../behavior/json-long.md). **Sibling:** [fill.md](./fill.md).

This file is **development-only** (see repo `.gitignore` for `docs/phases/`).

**Note:** “Missing keys in source” is **`i18nprune missing`** — see [commands/missing](../commands/missing/README.md) — not a **`generate`** flag.

---

## 1. Foundations — done

| Goal | Implementation |
|------|----------------|
| **`--json` + no prompts** | Non-interactive runs require **`--target`**; throws **`USAGE`** with a clear message (`packages/cli/src/commands/generate/run.ts`). |
| **Meta defaults** | **`--target`** present → catalog-backed **`englishName`**, **`nativeName`**; direction from **`--direction`** or default **`ltr`** (`mergeGenerateOptionsFromEnv` + prompts when interactive). |
| **Direction** | **`--direction rtl` \| `ltr`** supported; aligned with meta sidecar writes. |

**Acceptance:** covered by command behaviour + [commands/generate](../commands/generate/README.md).

---

## 2. Shared missing-key helper — moved

**`computeMissingLiteralKeys`** lives in **`packages/cli/src/core/validate/missingLiterals.ts`** and is used by **`validate`** and **`missing`** — not part of **`generate`**.

---

## Optional follow-ups (implemented)

- **RTL vs `--direction` (warn-only):** heuristic list in **`packages/cli/src/core/languages/rtlHint.ts`** — **`generate`** warns when a typical RTL code uses **`ltr`**, or a typical LTR code uses **`--direction rtl`** (human mode only; suppressed in **`--json`**).
- **Reports:** **`generate`** calls **`pushReportEntry`** + **`finalizeReportFile`** on success and when skipping because the target already covers the source (aligned with **`fill`** / **`sync`**).

---

## Planning — per-target progress summary in the final envelope

**Status:** **Shipped** (shared **`TargetProgressSummary`** on **`targetResults[].progress`** for **`generate`** and **`fill`**). See **`packages/cli/src/types/core/progress/index.ts`** and **`types/command/{generate,fill}/json.ts`**.

### Goals (met)

| Goal | Description |
|------|-------------|
| **Per-target summary** | **`targetResults[]`** rows include optional **`progress`** (**`TargetProgressSummary`**: `processedLeafCount`, `translatedLeafCount`, `preserveCount`, `paritySkipCount`, `forced`, `durationMs`, …). |
| **Multi-target runs** | One stdout **`CliJsonEnvelope`**; **`data.targetResults`** ordered with processing order. |
| **Forced re-generate (`--yes`)** | **`progress.forced`** and counters distinguish parity skip vs rewrite where applicable. |
| **Human vs JSON** | **`--json`** encodes per-target **`progress`**; human mode unchanged. |

### Non-goals (unchanged)

- Per-leaf translation traces in the envelope (report / **`--report-file`**).
- Envelope-level **`ok`** semantics unchanged; identity-streak abort uses **`issues[]`** (`i18nprune.translate.identity_streak_*`).

### Acceptance

- [x] Integration coverage for multi-target / JSON payloads as exercised in repo tests.
- [x] Docs: [commands/generate](../commands/generate/README.md), [commands/fill](../commands/fill/README.md), [json README](../json/README.md).

---

## See also

- [fill.md](./fill.md) — **`fill`** shares the same **`targetResults`** / progress / identity-streak path.
- [phases README](./README.md)
- [missing.md](./missing.md)
- [validate.md](./validate.md)
