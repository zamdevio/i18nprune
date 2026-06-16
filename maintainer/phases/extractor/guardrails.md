# Extractor guardrails

**Purpose:** Preserve core extractor identity while expanding coverage.  
**Architecture (engines, normalizer, cache):** [`architecture.md`](./architecture.md) · **Sequencing:** [`README.md`](./README.md) · [`REVIEW.md`](./REVIEW.md).

Review this document **before** every extractor PR that adds detection logic, cross-file behavior, or new JSON fields.

---

## Core identity

The extractor is designed to be:

- **Fast** — cold scans on ~300-file TS projects stay in the **~500 ms** class (see perf budget in [`README.md`](./README.md))
- **Predictable** — same input → same `provenKeys` / `uncertainPrefixes` / issue codes (parity discipline)
- **Safe** — cleanup/sync must not delete keys that may still run at runtime
- **Practical** — regex-first heuristics that match how teams actually write i18n
- **Maintainable** — tiers and providers, not scattered one-off regex

The extractor is **not** designed to be:

- A TypeScript compiler
- A whole-program analyzer
- A bundler or module resolver
- A theorem prover
- A runtime execution engine

Evaluate every proposal against this list first.

---

## Primary rule

**False proven keys are worse than missed keys.**

| Outcome | Impact |
|---------|--------|
| Missed key | Inconvenience · user adds to locale manually |
| Falsely proven key | **Cleanup may delete a live translation** |

When uncertain: **prefer missing over proving**.

### Key buckets (enforced)

| Bucket | May cleanup delete? | How populated |
|--------|---------------------|---------------|
| **`provenKeys`** | Only under explicit user policy | Literals + fully resolved same-file templates |
| **`uncertainPrefixes`** | Protected by default (`uncertainKeyPolicy: protect`) | Mixed templates, partial prefixes |
| **`candidateKeys`** (v2) | **Never** auto-delete | Locale tree, typed unions, cross-file hints — require `confidence` |

Never promote `candidateKeys` → `provenKeys` without an explicit, documented policy change.

---

## Extraction depths (`extractor.depth`)

Three engine families — full model in [`architecture.md`](./architecture.md). Not shipped in config until v2.

| Depth | What runs | Cold budget (~316 files) | Phase docs |
|-------|-----------|--------------------------|------------|
| **`fast`** (default) | Full regex/heuristic stack: bindings, const-map, hooks, cross-file index, light dataflow, locale assists, HOC presets — **no TS Program** | **≤ ~900 ms** (CI-frozen behavior) | [`README.md`](./README.md), [`hoc.md`](./hoc.md), [`cross-file.md`](./cross-file.md), … |
| **`balanced`** | `fast` + **targeted TS** only at ambiguity boundaries | Between fast and typed | Escalation spec TBD |
| **`typed`** | TS Program, symbols, module resolution, deeper dataflow | User accepts seconds-scale | [`ast-tier.md`](./ast-tier.md) |

**Rules:**

1. **`fast` is the default** — no `tsc` program on cold path; parity snapshots use `fast` only.
2. **`balanced` is not typed-lite** — selective semantic callbacks with caps; see [`architecture.md`](./architecture.md).
3. **`typed` is optional and isolated** — core must work with zero TS program; non-program files fall back to `fast` evidence in orchestrator.
4. **Merge like cache profiles** — explicit config wins; cache epoch includes `extractor.depth`.

---

## Cross-file analysis boundaries

Highest-risk area for complexity creep. See [`cross-file.md`](./cross-file.md).

### Allowed (bounded)

```ts
// constants.ts
export const NS = 'orders';

// page.tsx
import { NS } from './constants';
t(`${NS}.title`);
```

- Static relative imports (`./`, `../`) resolved to a file path
- Named `export const X = 'string'` and `export { X } from './bar'` up to **2 hops**
- Overlay into **per-file** effective const map (never one global merged map)

### Not allowed (hard stop)

```ts
export * from './shared';           // star re-export — bail
const v = process.env.MODE ? 'a' : 'b';  // runtime env — bail
import(dynamicPath);                // dynamic specifier — bail
```

Also not allowed:

- Arbitrary dependency graph traversal
- Bundler-style `tsconfig` path resolution beyond an explicit, capped tier
- Evaluating re-exports through `node_modules` packages

**Stop and reassess** if implementation starts looking like a bundler, resolver, or compiler pipeline.

---

## Complexity budget

Every new layer must answer:

1. **Coverage gain** — which real-repo pattern? (dogfood `apps/web`, sample-i18n, inventory row)
2. **Performance cost** — ms on reference benchmark; lazy skip path?
3. **Maintenance burden** — tests, fixtures, FP negatives?
4. **Simpler alternative** — preset table vs dataflow? locale candidates vs TS unions?

High complexity requires high leverage. If (4) has a simpler answer, ship that first.

---

## Layer 7 — provider principle (on hold)

**Status:** deferred until AST tier + extension ship — see [`provider-registry.md`](./provider-registry.md). v2 tiers (HOC, cross-file, etc.) do **not** wait on Layer 7.

Provider support is a **detection** problem, not a new extraction algorithm.

| Framework | Extension point | Guardrail |
|-----------|-----------------|-----------|
| react-i18next / next-i18next | Preset: `useTranslation` → local `t` | Table in core, not regex in `calls.ts` |
| next-intl | Preset: `useTranslations` → local `t` | Same |
| vue-i18n / svelte-i18n | Dedicated provider (Layer 7) | No Vue template logic in JS provider |

**Centralize** in provider registry — avoid scattering `if (nextIntl)` across `scan.ts` and `javascript.ts`.

Registry contract (target):

```txt
{ filePath, text, functions, constMap, depth } → { observations, dynamicSites }
```

---

## HOC and hook detection

Expected **high ROI**, **low ms cost** when done as presets. See [`hoc.md`](./hoc.md).

Prioritize before `balanced` / `typed` escalation:

```ts
const { t } = useTranslation();
const t = useTranslations();
const tt = t;
tt('key');
```

**Section B** (prop / HOC `t`) stays **opt-in** — high false-positive risk on props named `t`.

---

## Finite key evaluation

Useful for **validate UX**, not for proving deletable keys. See [`finite-keys.md`](./finite-keys.md).

### Allowed

```ts
const ns = 'orders';
t(`${ns}.title`);  // → proven via const (fast tier)
```

### Candidate expansion only (`fast` locale assist / `typed`)

```ts
t(`seo.routes.${routeId}.title`);
// candidateKeys from locale under prefix — NOT provenKeys
```

```ts
const ns = condition ? 'orders' : 'users';
t(`${ns}.title`);
// at most two finite branches — display/candidate only unless both resolve as proven
```

**Requirements:** deterministic · finite · bounded count · cap `candidateKeys` list size.

**Never:** unbounded enumeration · runtime execution · promote candidates to proven by default.

---

## Typed analysis rules

When `extractor.depth: 'typed'`:

- **Optional** — user enables explicitly
- **Explicit** — stderr/JSON notes typed tier active
- **Isolated** — lives behind adapter; fast path has zero import of `typescript` program APIs

Core validate/cleanup/sync **must work** with typed tier disabled.

Typed output uses `confidence: 'type_inferred'` — same bucket rules as locale candidates.

---

## API and parity guardrails

- **Issue codes are stable API** — never rename (`dynamic_key_sites`, `english_identical_leaves`, etc.)
- **`--json` envelope** — additive fields only on refactors; parity snapshots in `tests/parity/`
- **Core purity** — no `console.*` / `process.*` in `packages/core/src/extractor/**`
- **User docs** — update `docs/extractor/README.md` and inventory when behavior becomes user-visible; no `maintainer/` links in VitePress

---

## Stop conditions

Pause and reevaluate if a feature requires:

- Runtime execution or `eval`
- Program simulation across the whole repo
- Whole-project inference without caps
- Arbitrary dependency traversal
- Bundler-grade module resolution
- Compiler pipeline as the default path

These signal scope drift away from extractor identity.

---

## Performance philosophy

**Performance is a feature.**

Reference (dogfood, `validate --no-cache`):

```text
~316 .ts/.tsx files · ~1,177 keyObservations · ~88 dynamic · ~511–555 ms
```

Coverage improvements count only if they preserve this class of latency on the **default** tier.

A slower extractor is not automatically a better extractor.

**PR checklist:** note benchmark ms when touching hot path; add maintainer bench script before v2 tiers ship.

---

## Decision framework

Before merging new detection logic, all must be **yes** or explicitly accepted:

| Question | Required |
|----------|----------|
| Improves real-world coverage (named pattern + fixture)? | |
| Bounded (depth caps, lazy skip, finite outputs)? | |
| Predictable (documented limits in inventory)? | |
| Safe (primary rule — no false proven)? | |
| Preserves identity (not a compiler by default)? | |
| Preserves fast-tier ms budget? | |

If unclear → **do not implement** → gather evidence from real repos first.

---

## Long-term principle

```txt
Build capability → add structure → add enforcement → add guardrails → repeat
```

Evolve through **deliberate layers**, not isolated heuristics.

| Prefer | Over |
|--------|------|
| Clarity | Cleverness |
| Predictability | Magic |
| Safety | Extraction count |

---

## Related documents

| Doc | Role |
|-----|------|
| [`architecture.md`](./architecture.md) | Engines, normalizer, incremental cache, parity model |
| [`README.md`](./README.md) | Shipped baseline (C.1 / E / D) + v2 index |
| [`REVIEW.md`](./REVIEW.md) | Before/after analysis for external review |
| [`provider-registry.md`](./provider-registry.md) | Layer 7 — on hold until AST + extension |
| [`hoc.md`](./hoc.md) · [`cross-file.md`](./cross-file.md) · [`finite-keys.md`](./finite-keys.md) · [`light-dataflow.md`](./light-dataflow.md) · [`ast-tier.md`](./ast-tier.md) | Phase implementation notes |
| [`docs/edge-cases/unsolved/inventory.md`](../../../docs/edge-cases/unsolved/inventory.md) | Open limit rows |
| [`docs/edge-cases/unsolved/policy-framework.md`](../../../docs/edge-cases/unsolved/policy-framework.md) | Policy trade-offs |

**Do not merge into:** user-facing docs until behavior ships.
