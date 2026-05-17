# Extractor Improvement Plan (JS/TS-first)

This document captures the agreed extractor direction **after** the initial core extraction/migration work.
It is intentionally **planning-first**: Session **C.1.1–C.1.6** are **implemented and shipped** in core, but this file stays the **authoritative design narrative** and slice checklist for future work (see also `docs/edge-cases/unsolved/inventory.md`).

## Decisions (locked for now)

- **Scope (language support):** JS/TS only (plus JS-like single-file variants already treated as “JS-like”: `.vue`, `.svelte`).
- **Scope expansion:** adding other languages (e.g. Python) is a **medium priority** follow-up **only after** the JS/TS extractor is “boringly stable”.
- **Extensibility model:** **provider-driven inside `@i18nprune/core` now**, with the option for **external plugins later** (medium priority).
- **Core vs clients:** core is **data-only** (engine + orchestration) and **never prints**; clients (CLI, editor extensions, API hosts) handle presentation/UI and exit behavior.
- **Restructure:** no heavy algorithm rewrite right now; prefer **clearer grouping + export surfaces** that make extension points obvious.

## Current state (as of this doc)

- **Session C.1 (shipped):** import binding scan + per-orchestrator `functions` expansion, prose first-arg filter, commented-call dynamic parity tests, edge-case inventory, and methodology docs (`docs/extractor/README.md`, `maintainer/systems/extractor.md`).
- Pure extraction primitives live under `packages/core/src/extractor/**` (bindings, shared, constmap, keySites, dynamic, …).
- Project-level orchestration that depends on CLI `Context` + filesystem (walking the tree, reading files) may remain in the CLI until we decide to migrate `Context` or define a “host runner” contract.

## Medium-priority roadmap items

### 0) Extractor hardening — Session C.1

**Goal:** make the extractor's call-site detection reliable by adding import binding resolution (alias-aware detection) and then tightening lexical validation to reject prose false positives.

**Why binding resolution comes first:** the current extractor matches configured function names (`functions: ['t']`) by regex. It cannot detect `import { t as newT } from '...'` — if a file aliases `t`, those calls are invisible. Adding per-file binding resolution enriches the function set flowing into `findTranslationCallSites`, making all downstream detection (keySites, dynamic, comment classification) more accurate. The false-positive hardening then operates on this richer input.

**Architecture — three-system model:**

The extractor uses three complementary systems (no AST parser, no dataflow analysis):

| System | Responsibility | Module |
|--------|----------------|--------|
| **Import binding resolver** | Detect aliases (`t as newT`), namespace imports (`* as i18n`), CJS destructuring | `extractor/bindings/` (Session C.1.1 — **shipped**) |
| **Scope/const tracker** | Reconstruct `const NS = 'app'` for template substitution | `extractor/constmap/` (shipped) |
| **Expression evaluator** | Rebuild `` `${NS}.title` `` → `app.title` | `extractor/dynamic/rebuild.ts` (shipped) |

**Per-file pipeline (after C.1.1–C.1.2):**

```
config.functions ─────────────────────────────────┐
                                                   ↓
text = readFile(f) ──→ scanImportBindings(text) ──→ expandFunctionsWithBindings()
                   ├─→ commentRangesForJsLikeText()        ↓
                   ├─→ buildConstStringMap()          effectiveFunctions
                   │                                       ↓
                   └───────────────────────→ findTranslationCallSites(text, effectiveFunctions)
                                                           ↓
                                              ┌────────────┴────────────┐
                                              ↓                        ↓
                                      scanKeyObservations    findDynamicKeySitesRaw
                                      (keySites pipeline)    (dynamic pipeline)
```

**Import patterns handled by binding resolution (all regex-feasible):**

| Pattern | Example | Result |
|---------|---------|--------|
| Named import | `import { t } from '...'` | `t` confirmed as translation fn |
| Named import with alias | `import { t as newT } from '...'` | `newT` added to effective set |
| Default import | `import i18n from '...'` | `i18n.t` added when `t` is configured |
| Namespace import | `import * as i18n from '...'` | `i18n.t` added when `t` is configured |
| CJS destructuring | `const { t } = require('...')` | `t` confirmed |
| CJS with rename | `const { t: newT } = require('...')` | `newT` added |

**Patterns NOT handled (documented as known limits — no dataflow analysis):**

| Pattern | Why skipped |
|---------|-------------|
| `const tt = t; tt('key')` | Requires variable tracking across statements |
| `const fn = cond ? t : other` | Requires control-flow analysis |
| `foo(t)` / higher-order passing | Requires understanding function signatures |
| `const { t } = useTranslation()` | Runtime return value — needs framework-specific hook config (deferred) |

**Implementation slices (Session C.1) — all shipped:**

1. ✅ **C.1.1 — Import binding resolution module**
   - `packages/core/src/extractor/bindings/imports.ts`: regex-based scanner for ESM `import` and CJS `require` destructuring patterns.
   - `packages/core/src/extractor/bindings/expand.ts`: expand configured `functions[]` with per-file alias discoveries.
   - Types: `packages/core/src/types/extractor/bindings/`.
   - Tests: `packages/core/src/extractor/bindings/__tests__/imports.test.ts` — all six import patterns, negative cases, kitchen-sink snapshot.
2. ✅ **C.1.2 — Wire binding expansion into orchestrators**
   - `packages/core/src/extractor/keySites/orchestrate.ts`: `scanImportBindings` + `expandFunctionsWithBindings` per file before `scanKeyObservations`.
   - `packages/core/src/extractor/dynamic/orchestrate.ts`: same expansion before `findDynamicKeySitesForFile` (including merged-text entrypoint).
   - `packages/core/src/extractor/dynamic/providers/javascript.ts`: receives expanded `functions` from orchestrators.
   - Tests: `keySites/__tests__/orchestrateBindings.test.ts`, `dynamic/__tests__/orchestrateBindings.test.ts`, `dynamic/__tests__/rebuild.test.ts` alias coverage.
3. ✅ **C.1.3 — Call-site lexical hardening (false-positive rejection)**
   - Candidate parsing in `packages/core/src/extractor/shared/calls.ts`: reject `firstArgRaw` that matches prose patterns (consecutive lowercase words separated by whitespace, not valid JS expression starts).
   - Valid JS/TS expression starts remain accepted so real code-like calls (including commented-out code) stay detectable.
   - `packages/core/src/extractor/shared/__tests__/calls.test.ts`: prose rejection (`t (or vice versa)`-style), preserved detection for common valid call shapes.
4. ✅ **C.1.4 — Commented-call parity tests**
   - Dynamic per-file: commented non-literal / template calls → `kind: 'commented'`, `isCommented: true`; prose in comments omitted.
   - `// t('literal')` does **not** emit a dynamic site (literal skipped in raw scan — see `dynamic/__tests__/commentedCallParity.test.ts`).
5. ✅ **C.1.5 — Edge-case inventory entries**
   - `docs/edge-cases/unsolved/inventory.md`: prose filter scope, reassignment alias gap, hook destructuring (`extractor-prose-first-arg-filter`, `extractor-reassignment-alias`, `extractor-hook-return-destructuring`).
6. ✅ **C.1.6 — Extractor methodology documentation**
   - **User-facing** `docs/extractor/README.md`: three-system model, per-file pipeline, limits, best practices, links to inventory and this phase doc.
   - **Maintainer** `maintainer/systems/extractor.md`: subsystem map + Session C.1 pointer + inventory link; `maintainer/systems/README.md` row for `bindings/`.

**Execution order (historical):** C.1.1 → C.1.2 → C.1.3 → C.1.4 → C.1.5 → C.1.6. **Session C.1 is complete**; unresolved behavior stays triaged in `docs/edge-cases/unsolved/inventory.md`.


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

