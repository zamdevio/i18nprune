# Phase — Review command uplift

**Status:** **Active** — primary CLI focus after **`locales` / `generate` / `fill`** completion.  
**Command:** `i18nprune review`

This phase upgrades `review` from simple parity counters into a richer locale-audit command with stronger human UX and structured machine payloads.

---

## Why this phase exists

Current `review` output is useful but shallow:

- mostly locale-level counts
- reserved `--top` / `--full` flags without per-path detail
- no rich grouping/filters for reviewer workflows

We already have stronger extraction + scanning foundations in i18nprune; this phase uses them to deliver a complete review surface.

---

## Temporary implementation reference

For development parity checks, use the legacy script behavior as a temporary benchmark:

- `apps/web/scripts/locales/review/index.ts` (external project flow reference)

Important:

- this phase doc keeps the reference only while implementation is in progress
- **when this phase is closed, remove legacy-product references** from the phase text and keep only i18nprune-native behavior/docs

---

## Scope

### 1) Human output parity uplift

Add richer, readable review modes:

- **Shipped (first slice):** CepatEdge-style **colors and line shape** for summary output (`[i18nprune]` orange brand, `[review]` tool tag, `[info]` / `[warn]`, cyan section headings) — see [commands/review](../commands/review/README.md#human-mode-today).
- compact summary per locale
- grouped views (by status / by source)
- path list capping (`--top`) and full expansion (`--full`) for human mode
- clear option preamble + actionable follow-up hints

### 2) JSON payload uplift

Extend `review --json` to include richer per-locale and per-row data where stable:

- locale summary blocks
- grouped counters
- optional row slices (bounded by documented policy)
- stable `issues[]` usage with issue codes and doc anchors

### 3) Filters and slicing

Plan filters that match reviewer workflows:

- locale selection (`--target` and potential multi-target evolution)
- needs-review/status/source/confidence filters (if schema supports them)
- consistent precedence and deterministic row ordering

### 4) Shared-core alignment

Keep orchestration in `commands/review`, push logic into core modules:

- reusable aggregators
- reusable row slicers
- shared type contracts for human and JSON paths

---

## Non-goals

- changing generate/fill translation behavior
- patching/loader mutations (ADR 004 track)
- replacing validate/missing responsibilities

---

## Acceptance criteria

- [ ] `review` human mode supports meaningful per-path views (not only aggregate counts)
- [ ] `--top` / `--full` semantics are active and documented for human mode
- [ ] `review --json` exposes stable, richer structured review data
- [ ] issue-code coverage includes common review failures/warnings with doc anchors
- [ ] tests cover mode formatting/slicing and JSON contracts
- [ ] docs updated (`commands/review`, behavior/json docs, issue-codes when needed)
- [ ] phase doc cleaned of temporary legacy references on completion

---

## Delivery plan

1. Define target schema + CLI option semantics.
2. Implement core row extraction + aggregation module.
3. Implement human renderers (summary/by-status/by-source) with top/full behavior.
4. Upgrade JSON envelope payload/types.
5. Add tests and docs; remove temporary compatibility notes once done.
