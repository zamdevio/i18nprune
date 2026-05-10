# Closed slices — reference only (do not duplicate trackers)

Narratives live in **user docs** below; phase checklists here are intentionally **minimal**.

| Slice | Status | User docs |
|-------|--------|-----------|
| **Locales** (`list`, meta `edit`, `dynamic`, `delete`, `--json`) | Shipped | [`commands/locales`](../../docs/commands/locales/README.md) |
| **Generate** (core translate path, `--json`, progress envelope, identity guard) | Shipped | [`commands/generate`](../../docs/commands/generate/README.md), [`behavior`](../../docs/behavior/json-long.md) |
| **Fill** (same envelope + parity with generate) | Shipped | [`commands/fill`](../../docs/commands/fill/README.md) |
| **Exports + baseline `--json`** | Shipped | [`docs/exports/README.md`](../../docs/exports/README.md), [cli-json parity](../../docs/edge-cases/solved/cli-json-command-parity.md) |
| **`i18nprune.dev` / `apps/web`** baseline | Shipped | `apps/web` (marketing site codebase) |
| **Command orchestrator boundary** | Shipped (guardrail) | [`commands/orchestration/README.md`](../../docs/commands/orchestration/README.md), [`ADR 006`](../../docs/architecture/decisions/006-command-orchestrator-boundary.md) |
| **Key reference + preserve + `--ask`** | Shipped | [`docs/regex/README.md`](../../docs/regex/README.md), [`docs/cli/prompts/README.md`](../../docs/cli/prompts/README.md), [`docs/config/policies/README.md`](../../docs/config/policies/README.md) |
| **Key observations (`keySites`) + validate JSON** | Shipped | [`docs/regex/key-sites-and-dynamic.md`](../../docs/regex/key-sites-and-dynamic.md), [`docs/exports/core.md`](../../docs/exports/core.md) (`keySites` namespace) |
| **`missing` command** | Shipped | [`commands/missing`](../../docs/commands/missing/README.md) |
| **`sync`** merge preserves structured `{ value }` leaves at existing paths | Shipped (engine) | Uses core `mergeToTemplateShape` — pair with **`locales` / metadata** docs when you document edge cases |
| **Translate policy** (classifier → schema → resolver → `runGenerate` → handoff → JSON `translateFailureOutcome` → partial-run **`onIncompleteRun`** / envelope) | Shipped (steps 1–10) | [`docs/config/translate.md`](../../docs/config/translate.md), [`maintainer/phases/translate-policy.md`](../phases/translate-policy.md) |

Maintainer sequencing for **remaining** work: **[`../V1-RELEASE.md`](../V1-RELEASE.md)**.
