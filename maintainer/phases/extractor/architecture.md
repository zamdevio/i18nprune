# Extractor & incremental analysis architecture

**Purpose:** Long-term spine for extraction engines, normalization, caching, and downstream contracts.  
**Guardrails (safety / PR checklist):** [`guardrails.md`](./guardrails.md) · **Sequencing:** [`README.md`](./README.md) · **Engineering map:** [`maintainer/systems/extractor.md`](../../systems/extractor.md) · **Disk cache:** [`maintainer/systems/cache.md`](../../systems/cache.md).

---

## Core philosophy

The long-term goal is not multiple downstream systems.

```txt
Multiple extractors
        ↓
Normalized evidence
        ↓
Project analysis model
        ↓
Everything else
```

All CLI commands, SDK APIs, reports, validation, cleanup, extension features, search, AI features, and future tooling consume the same normalized analysis model (`ProjectAnalysis` / `analysis.json` contract).

**`extractor.depth` affects only how evidence is gathered, not how downstream systems operate.**

Types today: [`packages/core/src/types/analysis/index.ts`](../../../packages/core/src/types/analysis/index.ts) (`ProjectAnalysisCacheData`, `KeyObservation`, `DynamicKeySite`).

---

## Extractor depths

Config surface (planned v2):

```ts
extractor: {
  depth: 'fast' | 'balanced' | 'typed'
}
```

Not `extractor.mode` — `search --mode` owns lookup modes. Merge overrides like `cache.profile`; explicit config wins.

### `fast` (default)

Regex / heuristic engine only. **No TypeScript Program. No semantic type resolution.**

Includes the full planned heuristic stack:

- translation call detection
- hook detection (presets)
- alias tracking
- const maps
- cross-file const index
- finite-key locale assists
- HOC presets
- light dataflow
- other regex-tier improvements (shipped E.1–E.6 / D.1 + v2 phases)

Goals:

- deterministic performance
- **frozen CI / parity behavior** (`tests/parity/` on `fast`)
- broad language support (`.js`/`.ts`/`.vue`/`.svelte`, …)

**Note:** `fast` means **no typechecker**, not “minimal accuracy.” Cold-scan budget may grow as heuristics land (~≤900 ms on reference project) — document as frozen **behavior**, not sub-500 ms forever.

### `balanced`

Hybrid engine:

```txt
Regex first
      ↓
Ambiguity detected
      ↓
Targeted TS resolution
      ↓
Normalized evidence
```

Uses TypeScript **only when heuristics cannot confidently resolve** a situation.

Examples:

- unresolved aliases beyond heuristic limits
- complex hook propagation
- deeper import chains
- difficult template resolution
- dataflow beyond regex engine

Balanced is **not** typed-lite. It is:

```txt
Fast engine + selective semantic escalation
```

Requires a written **escalation spec** (triggers, per-file caps, merge rules) before implementation — see [`guardrails.md`](./guardrails.md).

### `typed`

Full semantic mode:

- TS Program
- symbol resolution
- module resolution
- type information
- deeper dataflow

Most complete. Slowest cold-start. Expected to rely on **per-file cache** and incremental invalidation.

Non-program files (e.g. some `.vue`/`.svelte` until program providers exist) fall back to **`fast` evidence** inside the orchestrator — downstream stays unaware.

Phase detail: [`ast-tier.md`](./ast-tier.md).

---

## Canonical normalization boundary

Every extractor produces **evidence**. No extractor produces final project conclusions directly.

```txt
Raw evidence (per file / per engine)
      ↓
normalizeEvidence()
      ↓
ProjectAnalysis
```

The normalizer owns:

- promotion rules
- `provenKeys` / `uncertainPrefixes` / `candidateKeys` buckets
- `KeyObservation` / `DynamicKeySite` kinds
- `dynamicActive` / `dynamicCommented` split
- confidence metadata (additive; hosts may ignore)

**Primary rule:** false proven keys are worse than missed keys — enforced only in the normalizer ([`guardrails.md`](./guardrails.md)).

Engines may attach optional provenance:

```ts
provenance?: { depth: 'fast' | 'balanced' | 'typed'; resolver?: string }
confidence?: 'proven' | 'heuristic' | 'semantic' | 'type_inferred'
```

---

## Parity expectations

Do **not** require identical rows across depths.

Expected refinement:

```txt
fast      dynamic = 10
balanced  dynamic = 5
typed     dynamic = 2
```

That is not a parity failure.

| Parity goal | Not required |
|-------------|----------------|
| Same schema | Same counts |
| Same downstream contract | Same warnings |
| Same safety rules | Same observations |

**CI freezes `fast` only** for `tests/parity/` snapshots. `balanced` / `typed` get dedicated fixture suites.

---

## Incremental cache system

Long-term: **per-file** evidence cache layered on today’s disk model ([`cache.md`](../../systems/cache.md)):

| Layer | Today | Evolution |
|-------|-------|-----------|
| `files.json` | fingerprints + delta | + structural imports per file |
| per-file evidence | — | `hash`, imports, exports, raw evidence, normalized evidence |
| `analysis.json` | aggregated `ProjectAnalysis` | unchanged **contract** — merge of per-file normalized evidence |

Workflow:

```txt
File changed
      ↓
Hash mismatch
      ↓
Re-extract file → evidence
      ↓
normalizeEvidence()
      ↓
Refresh per-file cache entry
      ↓
Merge → update analysis.json aggregate
```

Avoid full project rebuilds when safe. **Cache epoch must include `extractor.depth`** (+ `extractor.version`, `tsconfigHash` / program snapshot id for `balanced`/`typed`). Switching depth without invalidation is a cleanup risk.

---

## Dependency propagation

The hard problem is not AST extraction — it is knowing **which cached facts became stale**.

Example: `export const NS = 'dashboard'` → `'settings'` — dependent files may need re-analysis even if their file hashes are unchanged.

### Structural dependency graph (v1)

Track exports, imports, relationships. When a relevant export changes → invalidate dependents → recompute dependents (not full project if avoidable).

### Evidence dependency graph (v2)

Import graph alone is insufficient. Track **which imported values influenced extraction evidence**:

```ts
import { NS } from './i18nNs';
t(`${NS}.title`);   // NS → evidence-relevant

import { NS } from './i18nNs';
const x = NS;       // NS → not evidence-relevant for i18n
```

Desired:

```txt
Export changed → find evidence depending on export → invalidate only relevant files
```

Not:

```txt
Export changed → invalidate every importer
```

Ship **conservative over-invalidation** first; tighten with tests.

### Missing cache entries

```txt
Missing cache = unknown state
```

Treat as potentially changed: reprocess file, invalidate dependents, refresh graph. Prefer extra work over stale analysis.

### Safety principle (cleanup)

For deletion / cleanup paths:

```txt
Invalidate too much  >  invalidate too little
```

A few extra file scans cost milliseconds. Stale dependency can cause incorrect cleanup suggestions.

---

## Future pipeline

```txt
Source files
      ↓
Extractor(s)     fast | balanced | typed
      ↓
Raw evidence
      ↓
normalizeEvidence()
      ↓
Per-file cache
      ↓
Evidence dependency graph
      ↓
ProjectAnalysis  (analysis.json)
      ↓
CLI / SDK / extension / search / AI
```

Extractors are replaceable (regex, hybrid, typed, future SWC / per-language providers). The **project analysis model stays stable**.

Provider registry (non-JS languages) plugs into the same evidence → normalizer path — on hold until AST tier + extension; see [`provider-registry.md`](./provider-registry.md).

---

## Implementation order (when coding)

1. Complete **`fast`** heuristic stack (v2 phase docs).
2. Introduce **`RawEvidence`** + **`normalizeEvidence()`** — route existing regex path through it without behavior change.
3. Cache epoch includes **`extractor.depth`**.
4. **`typed`** spike on fixtures — prove normalizer absorbs semantic evidence.
5. Per-file evidence cache (structural invalidation first).
6. **`balanced`** escalation on top of fast + typed building blocks.
7. Evidence dependency graph (smart invalidation).

Do not build incremental typed cache before the normalizer boundary exists.

---

## Related documents

| Doc | Role |
|-----|------|
| [`guardrails.md`](./guardrails.md) | Safety, buckets, stop conditions, PR checklist |
| [`README.md`](./README.md) | Shipped receipts, phase index, perf budget |
| [`hoc.md`](./hoc.md) · [`light-dataflow.md`](./light-dataflow.md) · [`cross-file.md`](./cross-file.md) · [`finite-keys.md`](./finite-keys.md) | `fast`-tier heuristic phases |
| [`ast-tier.md`](./ast-tier.md) | `typed` depth |
| [`REVIEW.md`](./REVIEW.md) | Before/after review copy |

**Do not merge into:** user-facing VitePress until behavior ships.
