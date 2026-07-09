# Honest SDK export tiers — remediation plan

**Status:** scratch — may promote to [`phases/exports.md`](../phases/exports.md) after EX-P1 lands.  
**Context:** EX-P0 ([`fada5a3`](../../.git)) unblocked npm v1 publish gate with mechanical classification; this doc tracks the **semantic** follow-up.  
**Maps:** [`phases/exports.md`](../phases/exports.md) (EX-0…EX-5) · [`systems/exports.md`](../systems/exports.md) (tier definitions) · [`expgov.config.ts`](../../expgov.config.ts) (live rules).

---

## 1. Problem statement

**EX-P0 was necessary but insufficient.**

Commit `fada5a3` added ~700 unclassified root flats to `tiers.stable.exact` via one-off generator scripts (`analyze-tiers.mjs`, `gen-expgov-exact.mjs`, `write-expgov-config.mjs`). That was the right **publish-gate** move: `expgov validate` must exit 0 before npm v1, and ~700 symbols had no tier rule. The dump used legacy `tiers.ts` defaults (everything unmatched → stable) — not a module-by-module audit.

**Validate is green; honesty is not.**

`pnpm exec expgov validate -j` today reports `unclassified=0`, `violations=0`, but:

- **`stable.exact` holds 700 literals** — a bulk allowlist, not curated API surface.
- **`@sdkTier` JSDoc: 0 usages** in `packages/core` — no source-of-truth tags on declarations.
- **`internal=0` on root flats** — envelope glue, worker/share orchestration, and concurrency helpers still read as stable.
- **`tiers.policies.experimental.rules.rootFlat: 'allow'`** waives 34 **advanced** symbols that remain root flats until EX-3.

**Downstream risk if we ship npm v1 with dishonest stable labels**

| Risk | Example |
|------|---------|
| False semver promise | `ShareRunInput`, `workerProjectIngestUrl`, `PayloadProcessorEnvironment` labeled stable — integrators treat removals as breaking minors |
| Bundle bloat | Extension/worker hosts import root; stable label encourages `import { … } from '@i18nprune/core'` instead of op subpaths |
| EX-3 pain | Moving 700+ “stable” flats to tier subpaths becomes a breaking 2.0 with no prior honest `/advanced` or `/internal` signal |
| Support burden | External users build on worker ingest URLs, share session types, cache dispatch internals we never intended as public contract |

**npm v1 can ship after EX-P0** (gate met). **Semantic remediation (EX-P1) should land before we market a semver-clean SDK** and must complete before EX-3 root slimming.

---

## 2. Current state snapshot

*Verified 2026-07-10 via `expgov validate -j` and `expgov.config.ts` parse.*

### Validate summary

| Metric | Value |
|--------|------:|
| Root flat exports | 1,003 |
| **stable** (root) | 969 |
| **advanced** (root) | 34 |
| **internal** (root flats) | 0 |
| **unclassified** | 0 |
| Violations | 0 |
| Tier source | `@sdkTier=0` · `config=1,003` · `default-prefix=0` |

### Config buckets ([`expgov.config.ts`](../../expgov.config.ts))

| Bucket | `exact` | `prefix` | Notes |
|--------|--------:|----------|-------|
| **stable** | **700** | 14 rules (`ISSUE_`, `^run[A-Z]`, `run`, `build`, `get`, `set`, `resolve`, …) | ~269 flats match prefix rules; rest are `stable.exact` dump |
| **advanced** | 3 | 13 regex/prefix rules (`^ENV_TRANSLATE_`, `^Provider`, `^resolveProvider`, …) | 34 root flats total; **`rootFlat: allow`** policy suppresses violations |
| **internal** | 2 (`wrapCoreEnvelope`, `unwrapCoreEnvelope`) | `internal`, `Internal$` | No root flat internals classified today |
| **policies** | `experimental.rootFlat: 'allow'` on advanced bucket | | Temporary until EX-3 |

### What's honest vs not

| Honest | Dishonest / provisional |
|--------|-------------------------|
| `ISSUE_*` → stable via prefix (→ `/issues` in EX-1) | 700 `stable.exact` entries — mixed worker, share, cache, hosted ingest |
| `^run[A-Z]` → stable orchestration | `Share*`, `Worker*`, `hosted*`, `PayloadProcessor*` on stable |
| Advanced translator/provider/env symbols (34) — tier correct, placement wrong | Same 34 waived as root flats |
| `wrapCoreEnvelope` / `unwrapCoreEnvelope` in internal.exact | `mapWithConcurrency`, share JSON heal helpers, worker error mappers still stable |
| tsconfig ↔ npm exports parity (EX-P0) | Zero `@sdkTier` tags; no module-path-based rules |

### Known misclassification samples (stable.exact → target tier)

| Symbol(s) | Source area | Target |
|-----------|-------------|--------|
| `ShareRunInput`, `ShareHostHooks`, `shareRemoteIssueFromWorker`, … | `share/` | **stable** on `/share` subpath (EX-1 backlog) or **internal** for host-only glue |
| `workerProjectIngestUrl`, `WorkerApiEnvelope`, `workerErrorFromCode`, … | worker client glue | **internal** |
| `hostedIngestEnvelopeForShareContentHash`, `prepareShareHostedFromContext` | hosted ingest | **internal** |
| `PayloadProcessorEnvironment`, `KnownPayloadProcessorSurface` | worker payload | **internal** |
| `CacheDispatchResult`, `decideProjectAnalysisCacheInvalidation`, … | `cache/` introspection | **advanced** (power-user) or stable on `/cache` when subpath exists |
| `createGoogleTranslator`, `createLlmTranslator`, `Translator` | `translator/` | **advanced** |
| `mapWithConcurrency`, `resolveTranslateMaxParallel` | concurrency | **advanced** (already tiered; root placement waived) |
| `buildCliJsonEnvelope`, `stringifyEnvelope` (if on root) | CLI envelope | **internal** |
| `runValidate`, `runSync`, `runGenerate`, … | op `run.ts` | **stable** (keep) |
| `ISSUE_*` | issue codes | **stable** → `/issues` |

Re-run `expgov inventory -v` and filter `tier=stable category=other` to extend this list per slice.

---

## 3. Principles

Use tier definitions from [`systems/exports.md`](../systems/exports.md). When in doubt, **downgrade** (stable → advanced → internal) rather than over-promise.

| Tier | Question | Root flat in v1? | Root flat after EX-3? |
|------|----------|------------------|------------------------|
| **stable** | Would we document this in SDK quick-start and honor semver on minors? | Allowed (today) | **`runXxx`**, context factories only |
| **advanced** | Power-user / engine hook — breaking ok with deprecation notes? | Waived until EX-3 | **No** — `/advanced` namespace only |
| **internal** | Host glue, worker wire-up, unsupported external semver? | Should be **no** | **No** — `/internal` namespace only |

**Decision order**

1. **Orchestration entry** (`runXxx` from `*/run.ts`) → stable.
2. **Issue vocabulary** (`ISSUE_*`, issue types, doc-link helpers) → stable on `/issues`.
3. **Pure stateless helpers** (no i18n semantics) → stable on `/utils`.
4. **Cross-cutting i18n** (scanner, locale IO, placeholders) → stable on `/shared`.
5. **Translator policy, provider health, cache introspection, patching analyze** → advanced.
6. **CLI envelope, worker HTTP glue, share session wiring, concurrency pools** → internal.
7. **Domain op graphs** → stable on existing op subpath (`/validate`, `/generate`, …) — flat on root only when `runXxx` facade.

**Classifier mechanics** (prefer in order):

1. `@sdkTier` on the **defining** export ([expgov `tiers.tag`](../../Tools/expgov/docs/config.md)) — wins over config when `precedence: 'tag'`.
2. Config `prefix` / `exact` aligned to **source module** or barrel path (post–EX-1).
3. Avoid name-only heuristics that misclassify (`resolve*` stable prefix catches provider resolvers).

---

## 4. Phased remediation plan

### EX-P1 (aka EX-0.5) — Semantic reclassification

**Goal:** Shrink `stable.exact` to a curated set; move mislabels to advanced/internal; add `@sdkTier` on hot modules. **Validate stays green with honest tiers** — not by growing `stable.exact`.

| Slice | Scope | Outcome |
|-------|-------|---------|
| P1-a | **Worker + share glue** | Move `Worker*`, `hosted*`, `PayloadProcessor*`, share host hooks → `internal` exact/prefix; drop from `stable.exact` |
| P1-b | **Translator / provider** | Ensure `translator/`, `policies/` exports → `advanced`; add `@sdkTier advanced` on `create*Translator`, provider monitors |
| P1-c | **Cache / analysis introspection** | Classify cache dispatch, invalidation helpers → `advanced` or defer to `/cache` subpath rules |
| P1-d | **Envelope + concurrency** | `buildCliJsonEnvelope`, `stringifyEnvelope`, `mapWithConcurrency` → `internal` / `advanced`; remove from stable |
| P1-e | **Shrink stable.exact** | After each module pass, delete moved symbols from `stable.exact`; target **&lt;100** literals (only true stable non-prefix flats) |
| P1-f | **`@sdkTier` rollout** | Tag defining exports in `share/`, `translator/`, `cache/`, `shared/` namespaces — config becomes backstop |

**Tools**

```bash
pnpm exec expgov inventory -v -F tier,sourceModule,symbol   # module-grouped view
pnpm exec expgov suggest -F -T 50                            # never blind-append; review each hint
pnpm exec expgov graph -v                                    # re-export paths
pnpm exec expgov validate -j                                 # must pass after each PR
```

**Custom tiers / policies** ([expgov config reference](~/Tools/expgov/docs/config.md)):

- Keep `tiers.policies.experimental.rules.rootFlat: 'allow'` until EX-3 — but **stop adding stable labels** to symbols that will move off root.
- Optional `partnerApi` / custom policy with `rootFlat: 'deny'` for a `staging` bucket if we need CI to fail on new advanced root flats before EX-3.
- Use `tiers.tag: { name: 'sdkTier', precedence: 'tag' }` so JSDoc overrides noisy prefix rules.

**Exit criteria**

- [ ] `stable.exact` &lt; 100 (curated); no worker/share glue in stable
- [ ] `internal` root flats &gt; 0 where appropriate OR symbols only on `/internal` namespace (post–EX-1)
- [ ] `@sdkTier` on all `share/`, `translator/`, worker-client modules
- [ ] `expgov validate` green without adding new bulk exact lists
- [ ] Receipt / phase note; temp generators **deleted** (done)

### EX-1 — Subpath barrels (planned, in progress)

Per [`phases/exports.md`](../phases/exports.md): add `/issues`, `/utils`, `/shared`, `/advanced`, `/internal`; register in `expgov.config.ts` `core.subpaths`. **Update tier rules in the same PR** as each barrel lands.

### EX-2 — Migrate monorepo hosts

Import from tier subpaths; no behavior change. CLI → `/internal` for envelope; extension/examples → no `/internal`.

### EX-3 — Root slim + flip `rootFlat` to deny

| Action | Detail |
|--------|--------|
| Remove flat leaks | `ISSUE_*`, shared cherry-picks, advanced/internal flats off root |
| Root target | &lt;150 flat exports (`runXxx` + context factories) |
| Policy flip | `tiers.policies.experimental.rules.rootFlat: 'deny'` — 34 advanced violations become hard failures if any remain |
| Version | **`@i18nprune/core@2.0.0`** major bump |

---

## 5. Module ownership map

*`packages/core/src/` area → default tier. Override per symbol when the table is wrong.*

| Source module / area | Default tier | Subpath (target) | Notes |
|----------------------|--------------|------------------|-------|
| `validate/run.ts`, `sync/run.ts`, `generate/run.ts`, … | **stable** | `/validate`, `/sync`, … | `runXxx` on root facade |
| `shared/constants/issueCodes*` | **stable** | `/issues` | `ISSUE_*` prefix rule until EX-3 |
| `shared/` doc-link helpers | **stable** | `/issues` | `enrichIssuesWithDocHrefs`, etc. |
| `shared/json`, path helpers | **stable** | `/utils` | Pure: `getAtPath`, `deepClone`, `splitPath` |
| `shared/scanner`, locale read/write, placeholders | **stable** | `/shared` | Cross-cutting i18n |
| `config/` | **stable** | `/config` | `defineConfig`, schema, loaders |
| `types/` | **stable** | `/types` | Public type barrels |
| `runtime/` | **stable** | `/runtime/*` | Adapters |
| `translator/`, `policies/` | **advanced** | `/advanced` | Providers, rate limits, identity guard |
| `cache/` dispatch, invalidation, project disk introspection | **advanced** | `/cache` (backlog) or `/advanced` | Not quick-start API |
| `patching/` analyze internals | **advanced** | `/patching` (backlog) | `runPatching` stable; analyze hooks advanced |
| `share/` run orchestration types | **stable** | `/share` (backlog) | `runShare` stable; host hook types internal |
| `share/` worker HTTP, session, heal | **internal** | `/internal` | `shareRemoteIssueFromWorker`, JSON heal |
| Worker client (`worker*Url`, `WorkerApi*`, ingest parsers) | **internal** | `/internal` | CLI + workers only |
| Hosted ingest / payload processor | **internal** | `/internal` | Cloud worker glue |
| CLI envelope (`buildCliJsonEnvelope`, `stringifyEnvelope`) | **internal** | `/internal` | |
| `mapWithConcurrency`, translate parallel caps | **advanced** | `/advanced` | Already tiered |
| `doctor/`, `review/`, `report/` | **stable** op surface | `/doctor`, `/review`, `/report` (backlog) | `runDoctor`, etc. |
| `extractor/`, `analysis/` | **stable** / **advanced** | backlog subpaths | Extension/worker reads — classify per export |
| `namespaces/` re-exports | mirror owning tier | tier subpaths | Namespace ≠ automatic stable |

---

## 6. Workflow per slice

### Before editing tiers

```bash
pnpm exec expgov inventory -v > /tmp/inv-before.txt
pnpm exec expgov validate -j | jq '.data.sdkTiers'
```

### Per-module PR checklist

1. **Inventory** — `expgov inventory -v` filtered by source path; list symbols to move.
2. **Classify** — edit `expgov.config.ts`: remove from `stable.exact`; add to `advanced`/`internal` exact or prefix; add `@sdkTier` on definitions.
3. **Suggest** — `expgov suggest -F -T 20` for stragglers only; **manually** accept/reject each line.
4. **Validate** — `pnpm exec expgov validate -j` → `unclassified=0`, `violations=0`.
5. **Build gate** — `pnpm run core:build && pnpm typecheck && pnpm test`.
6. **Diff** — `expgov diff HEAD` — tier changes only; no accidental barrel edits in P1.
7. **Parity** — no CLI `--json` / issue code changes.

### PR description template

```markdown
## EX-P1: <module> tier reclassification
- Moved N symbols stable → advanced/internal
- stable.exact: 700 → <new count>
- @sdkTier tags added: <files>
- validate: unclassified=0 violations=0
```

### Do not

- Re-run bulk generator scripts or append `suggest` output wholesale to `stable.exact`.
- Add new root flats without tier decision.
- Change `expgov.config.ts` tier lists in the same PR as unrelated refactors.

---

## 7. npm v1 guidance

| Claim on **1.0.0** | Wait for **2.0** (EX-3) |
|--------------------|-------------------------|
| CLI + kits shipped; ops behavior frozen by parity tests | Root barrel is a **slim stable facade** |
| Op subpaths (`/validate`, `/generate`, …) are supported | `/issues`, `/utils`, `/shared`, `/advanced`, `/internal` as **primary** import paths |
| `expgov validate` CI gate (classification **present**, parity ok) | Honest tier labels on all published symbols |
| Issue **code strings** stable | No advanced/internal **flat** exports on root |
| Document: prefer op subpaths for bundle size | Market “semver-governed SDK surface” only after EX-P1 + EX-3 |

**README / docs wording (until EX-P1 completes):** say supported entrypoints are `runXxx` and documented subpaths; avoid implying every root export is long-term public API.

**After EX-P1:** stable tier matches integrator contracts; advanced/internal honestly labeled before npm marketing push.

**After EX-3:** publish `@i18nprune/core@2.0.0`; migration guide = import path changes only (monorepo hosts already on subpaths from EX-2).

---

## 8. Do not

1. **Bulk-dump unclassified symbols into `stable.exact`** — EX-P0 generators (`analyze-tiers.mjs`, `gen-expgov-exact.mjs`, `write-expgov-config.mjs`) are deleted; do not recreate.
2. **Treat validate-green as done** — `unclassified=0` with 700 stable literals is a gate, not a semantic audit.
3. **Expand `stable.exact` to silence suggest** — move symbols to the correct bucket or add `@sdkTier`.
4. **Ship EX-3 without EX-P1** — root slimming amplifies dishonest labels into breaking churn.
5. **Use `rootFlat: allow` to excuse new advanced/internal flats** — policy is temporary; do not add more waived violations.

---

## References

- Phase sequencing: [`maintainer/phases/exports.md`](../phases/exports.md)
- Tier definitions + host matrix: [`maintainer/systems/exports.md`](../systems/exports.md)
- Live config: [`expgov.config.ts`](../../expgov.config.ts)
- expgov policies / `@sdkTier`: [`~/Tools/expgov/docs/config.md`](~/Tools/expgov/docs/config.md)
- EX-P0 commit: `fada5a3`
