# Plan Alignment: `apps-detach-foundation`

Source plan reviewed: `/home/amf/.cursor/plans/apps-detach-foundation_644d76b8.plan.md`

This mapping captures what is already shipped in-repo, what is tracked in current phase docs, and what still needs explicit phase coverage.

## Quick status matrix

| Plan item | Plan status | Repo/phase status | Notes |
|---|---:|---:|---|
| Add workspace foundation (`pnpm-workspace.yaml`) | pending | **implemented** | `pnpm-workspace.yaml` exists with `packages/*` + `apps/*`. |
| Move CLI runtime to `packages/cli` | pending | **implemented** | CLI lives under `packages/cli`. |
| Create `packages/report` shared contract | pending | **implemented** | `packages/report` exists with schema/types/constants. |
| Move report SPA to `apps/report` | pending | **implemented** | `apps/report` exists and is built. |
| Report artifact pipeline (`apps/report/dist/index.html` -> CLI dist) | pending | **partially documented** | Artifact exists at `apps/report/dist/index.html`; keep build/copy guarantees in report/build docs. |
| Hard-fail guard for missing/failing report build artifact | pending | **needs explicit verification task** | Add explicit build guard acceptance checks in phase docs/CI notes. |
| Move docs app to `apps/docs` | completed | **implemented** | Already shipped. |
| Prepare `apps/web` (+ reserve `apps/extension`) | completed | **implemented/partially reserved** | `apps/web` exists; `apps/extension` slot remains roadmap-level. |
| CLI independent build/publish guardrails | pending | **needs explicit phase task** | Track as acceptance criteria in exports/docs-sync or dedicated infra note. |
| Architecture docs update for repo layout | pending | **partially implemented** | Scatter exists; unify in one architecture source-of-truth doc. |
| Commit strategy for restructure milestones | pending | **not phase-critical** | Process task; optional unless requested for current sprint. |
| Report evolution track extensions | pending | **report phase closed** | Move remaining ideas into dedicated roadmap/backlog if still desired. |

## Gaps worth adding to phase plans

1. **Build hard-fail guard (report artifact):** codify required checks in docs + CI expectations.
2. **CLI independence contract:** add explicit “no `packages/cli` runtime imports from `apps/*`” verification guidance.
3. **Architecture consolidation:** one canonical architecture page that states current monorepo boundaries and ownership.

## Where to track remaining work

- **Exports phase (closed):** `docs/phases/exports/README.md`
- **Architecture docs:** `docs/architecture/*` (canonical repo-structure source)
- **Roadmap/backlog:** only for non-blocking enhancements (e.g., extension slot evolution)
