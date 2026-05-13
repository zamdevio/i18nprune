# Extractor Improvement Plan (JS/TS-first)

This document captures the agreed extractor direction **after** the initial core extraction/migration work.
It is intentionally **planning-only** (no implementation is implied by its presence).

## Decisions (locked for now)

- **Scope (language support):** JS/TS only (plus JS-like single-file variants already treated as “JS-like”: `.vue`, `.svelte`).
- **Scope expansion:** adding other languages (e.g. Python) is a **medium priority** follow-up **only after** the JS/TS extractor is “boringly stable”.
- **Extensibility model:** **provider-driven inside `@i18nprune/core` now**, with the option for **external plugins later** (medium priority).
- **Core vs clients:** core is **data-only** (engine + orchestration) and **never prints**; clients (CLI, editor extensions, API hosts) handle presentation/UI and exit behavior.
- **Restructure:** no heavy algorithm rewrite right now; prefer **clearer grouping + export surfaces** that make extension points obvious.

## Current state (as of this doc)

- Pure extraction primitives live under `packages/core/src/extractor/**` (constmap, keySites scan, dynamic JS-like analysis, etc.)
- Project-level orchestration that depends on CLI `Context` + filesystem (walking the tree, reading files) may remain in the CLI until we decide to migrate `Context` or define a “host runner” contract.

## Medium-priority roadmap items

### 0) False-positive hardening for comment prose (planned next)

**Goal:** avoid misclassifying prose text like `t (or vice versa)` as a translation call while preserving detection of real commented-out `t`-family calls.

**Why this is first:** this directly affects report/validate signal quality and creates noisy dynamic-site entries that are not real runtime key usage.

**Implementation slices:**

1. **Call-site lexical hardening**
   - Tighten candidate parsing in `packages/core/src/extractor/calls.ts` so pseudo-calls from prose are rejected.
   - Keep valid JS/TS expression starts accepted so real code-like calls (including commented-out code) remain detectable.
2. **Commented behavior parity**
   - Keep current semantics in `packages/core/src/extractor/dynamic/providers/javascript.ts`:
     - real commented code calls are still emitted,
     - marked with `isCommented` / `kind: commented`.
3. **Regression tests**
   - Add explicit tests for:
     - prose false-positive rejection (`t (or vice versa)`-style),
     - real commented call detection still working,
     - unchanged behavior for normal active calls.
4. **Deferred edge-case tracking**
   - Add inventory entries in `docs/edge-cases/unsolved/inventory.md` for:
     - comment prose false positives,
     - translator function aliasing detection,
     - related alias/wrapper edge cases.

**Tracking note:** full execution plan lives at `/home/amf/.cursor/plans/extractor_false_positive_hardening_88836a77.plan.md`. 


### 1) Add non-JS/TS languages (deferred)

**Goal:** support additional languages (e.g. Python) without destabilizing the core extractor.

**Prerequisites (“boringly stable” definition):**
- Stable test matrix for JS/TS across:
  - `.js`, `.jsx`, `.ts`, `.tsx`
  - JS-like wrappers: `.vue`, `.svelte` (at least “no regression” support)
- Stable handling for:
  - literal keys
  - template keys (const substitution)
  - dynamic key detection classifications
  - comment detection (where supported)
- Clear provider interface + registry behavior (see below)

### 2) External plugins (deferred)

**Goal:** allow third parties to add providers without patching core.

**Non-goals initially:**
- no runtime plugin loading in the CLI during active core migration
- no “remote code execution” plugin model

**Plan:** design the provider interface and registry in core first; ship built-in providers in core; only later define an external plugin loading mechanism.

## Extractor extensibility model (provider-driven)

### Provider responsibilities (conceptual)

Providers are the unit of extensibility. They are responsible for “how to interpret a file”.

- **Inputs:** `{ filePath, text, functions, options }`
- **Outputs (data-only):**
  - literal/template observations (keySites)
  - dynamic key sites (heuristics)
  - optional metadata/capabilities (comment handling, line/col support, etc.)

Providers can be grouped by language families:
- `jsLike` provider(s): `.js/.jsx/.ts/.tsx/.vue/.svelte`
- future: `python`, `go`, etc.

### Registry responsibilities (conceptual)

- Deterministic provider selection (first match wins, or explicit priority)
- Behavior when multiple providers match
- Fallback behavior (no provider → skip)

## Core ↔ Client contract (events + results)

We want all operations (validate/fill/generate/sync/doctor/quality/…) to be able to report progress in a **transport-agnostic** way.

### Contract rule

- Core emits **machine-readable events** only.
- Clients subscribe and decide:
  - logging / UX
  - exit code / process termination

### Event stream (proposed shape)

All operations should support a common set of `run.*` events **when the operation has meaningful progress**:

- `run.started`
- `run.progress`
- `run.warning` (Issue-like payload)
- `run.error` (typed error payload, recoverable vs fatal)
- `run.completed` (final structured result/envelope)
- `run.failed` (fatal termination)

Notes:
- Not every operation needs fine-grained progress (e.g. `doctor` might emit only `started` + `completed`).
- The event model must be usable by:
  - CLI streaming logs/spinners
  - editor extensions UI progress bars
  - programmatic API consumers

### Error strategy (high-level)

- Prefer **structured issues** and `ok` outcomes for expected “bad states”.
- Reserve throws (e.g. `I18nPruneError`) for exceptional boundaries (bad usage, missing file on a write path, internal invariants).
- A future doc will make this contract explicit (see [`MIGRATION.md`](./MIGRATION.md) post-v1 backlog for standalone **`I18nPruneError`** architecture).

## Where to start (recommended execution order)

1. **Finish the current migration objectives** (core extraction parity + thin CLI shims), keeping stability-first discipline.
2. Introduce the **event contract** as a “core capability”:
   - define types
   - add a minimal emitter interface (callback or async iterable)
   - thread through 1–2 operations end-to-end (e.g. `generate`, `fill`) to prove it works
3. Only then start adding new providers/framework handlers or non-JS/TS languages.

