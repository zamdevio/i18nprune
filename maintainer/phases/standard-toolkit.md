# Standard-toolkit hardening phase

Status: Planned

This phase turns i18nprune’s multi-surface architecture into a repeatable, production-grade standard:

- CLI for humans
- JSON envelopes for CI/automation
- report artifacts for visualization
- core exports for programmatic integrations

## Why this phase exists

The core architecture is in place and already useful. The next step is reliability and adoption hardening: parity guarantees across surfaces, rapid onboarding, and explicit edge-case honesty.

## Objectives

1. Keep cross-surface behavior parity explicit and testable.
2. Make onboarding near-instant ("start in 60 seconds").
3. Keep issue-code lifecycle strict: constants, emit paths, docs, and discoverability.
4. Document unsolved edges clearly under `docs/edge-cases/unsolved/**`.

## Standard-adoption goals (sharpened)

These goals translate "become the standard" into execution policy:

1. CI gatekeeper posture: i18nprune should be the default CI gate for i18n drift/missing keys.
2. Mental-model ownership: treat i18n data as structured and observable, not opaque strings.
3. Ecosystem expansion: keep CLI + core stable while adding editor/review/integration surfaces.
4. Frictionless onboarding: first success in under 60 seconds with a deterministic command path.
5. Iteration advantage: ship small, high-signal improvements with strict behavior contracts.

## Execution tactics for the above goals

### 1) Become the CI gatekeeper

- Make `validate --json` the canonical CI entrypoint.
- Keep missing-key and drift outcomes machine-detectable (`ok`, `issues[]`, stable codes).
- Ensure docs show copy-paste CI recipes first (not prose-first guidance).

### 2) Own the mental model

- Keep structured locale-leaf mode and metadata reporting first-class in docs and examples.
- Preserve parity between human output and JSON envelopes so observability is consistent.
- Treat issue codes + docs links as part of the contract surface.

### 3) Expand ecosystem surfaces

- Maintain stable `i18nprune/core` APIs as integration anchor.
- Track extension/bot/dashboard integrations as post-core stability deliverables.
- Require parity checklist coverage before calling a new surface "ready".

### 4) Make onboarding trivial

- Keep `docs/onboarding/README.md` as canonical "start in 60 seconds" flow.
- Keep homepage "Get Started" CTA pointed to onboarding docs.
- Minimize first-run steps to init + validate + one CI gate pattern.

### 5) Leverage consistency + speed

- Prefer small changes with explicit acceptance criteria over large unbounded rewrites.
- Enforce cross-surface checks (CLI/JSON/docs/web) on every behavior-affecting change.
- Record unsolved tradeoffs quickly in `docs/edge-cases/unsolved/inventory.md`.
- Use static hygiene tools intentionally:
  - **`pnpm knip`** (repo root) for unused exports/files/deps/scripts.
  - **`madge`** for dependency graph/cycle visibility when topology changes.

## Workstreams

### A) Product reliability

- Define a minimum acceptance matrix per release:
  - CLI human flow sanity
  - JSON contract sanity
  - report artifact generation
  - core export smoke checks
- Add regression tests for parity-sensitive behavior.

### B) Documentation UX

- Add/maintain a "Start in 60 seconds" path.
- Finish examples coverage:
  - `docs/examples/commands/*`
  - `docs/exports/examples/*`
- Ensure command docs point to full examples.

### C) Issue-code governance

- Enforce constant + emit + docs-section flow for every new issue code.
- Keep apps/web links aligned with docs (`issues` reference, examples, behavior pages).

### D) Edge-case honesty

- Add unresolved behaviors under `docs/edge-cases/unsolved/<topic>/README.md`.
- Promote solved cases to `docs/edge-cases/solved/**` with links.

## Relationship to standards docs

- This file is execution-oriented phase planning.
- Long-lived policy and contributor-facing standards should live under `docs/standard/README.md` once stable and routine.

## Immediate next actions

1. Finish examples coverage through **[`V1-RELEASE.md`](./V1-RELEASE.md)** Session **H** (see **[`final.md`](./final.md)** for ADR rename + pre-publish polish).
2. Add Start-in-60-seconds draft.
3. Build unsolved-edge-case inventory and map to owners/commands.
4. Add parity checklist section to release/pre-merge docs.

## Current status against this phase

- Start-in-60-seconds path: drafted (`docs/onboarding/README.md`) and linked from home hero CTA.
- Unsolved inventory: scaffolded (`docs/edge-cases/unsolved/inventory.md`).
- Parity checklist: drafted (`docs/release/parity-checklist/README.md`).
- Next execution center: **Session C.3** (apps rework) per **[`V1-RELEASE.md`](./V1-RELEASE.md)**; **init** / **locales** verticals per hub.
