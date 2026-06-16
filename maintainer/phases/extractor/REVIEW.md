# Extractor program — full analysis (review copy)

**Purpose:** Single document for maintainer + external review (e.g. ChatGPT) — **what exists today** vs **end state after all planned phases**.  
**Branch:** `feat/extractor` (implementation work; E.1a landed in working tree as of this doc).  
**Date context:** June 2026 · pre–v1 launch track.

**Plan sources:**

| Track | Path | Status |
|-------|------|--------|
| Shipped baseline | [`README.md`](./README.md) | C.1 + E.1–E.6 + D.1 done |
| **Active** v2 program | [`README.md`](./README.md) + phase docs | HOC → … → AST tier |
| **On hold** | [`provider-registry.md`](./provider-registry.md) | After AST + extension |
| **Architecture** | [`architecture.md`](./architecture.md) | Normalizer, cache, depths |
| **Guardrails** | [`guardrails.md`](./guardrails.md) | Safety, PR checklist |

---

## 1. Executive summary

**Today:** i18nprune’s extractor is a **fast, regex-first, per-file** static scanner. It reliably finds literal keys and same-file const-folded templates, flags dynamic calls, and protects uncertain prefixes for cleanup/sync. On a ~316-file TS/React app it validates in **~511–555 ms** cold (`validate --no-cache`), ~1,177 key observations and ~88 dynamic sites.

**After Phase A (current temp plan, E.1–E.6):** Same speed tier. **Clearer, fused semantics** for mixed templates; tighter const-map and comment parity; unified JSON/CLI/report fields. Outcomes for most keys **unchanged**; **trust and consistency** improve — fewer duplicate rows, stable issue codes, harder to accidentally delete runtime keys.

**After Phase B (v2 `extractor/` program):** **Opt-in depth tiers** add framework hooks, cross-file `NS`, locale-assisted candidate keys, and light same-file dataflow — targeting **more found call sites** on React/Next monorepos while **default path stays ≤ ~600 ms** cold on the reference project.

**What it will never be:** A TypeScript compiler or whole-program prover. Cross-file dataflow, HOC prop tracing, and union-key expansion from types are **bounded, opt-in, or documented limits**.

---

## 2. Architecture today (shipped C.1 + E.1a on branch)

### Pipeline

```txt
config.functions[]
        ↓
per source file:
  readFile(text)
  scanImportBindings → expandFunctionsWithBindings → effectiveFunctions
  buildConstStringMap(text) → per-file constMap
        ↓
  findTranslationCallSites(text, effectiveFunctions)
        ├─→ scanKeyObservations        → KeyObservation[]
        │      literal | template_resolved | template_partial
        └─→ findDynamicKeySitesRaw       → dynamic candidates
               non_literal | template_interpolation | empty_call | commented
        ↓
merge (buildKeyReferenceContext):
  provenKeys          ← literal + template_resolved
  uncertainPrefixes   ← template_partial.uncertainPrefix + dynamic.resolvedPrefix
```

### Core modules

| Module | Role |
|--------|------|
| `extractor/bindings/` | Import aliases (`tr` → `t`), `i18n.t`, namespace patterns |
| `extractor/shared/calls.ts` | Match `t(…)`; prose false-positive filter |
| `extractor/constmap/` | `const X = 'string'` map; `${Ident}` substitution |
| `extractor/keySites/` | Literal + template observations |
| `extractor/dynamic/` | Non-literal / partial template sites |
| `shared/reference/context.ts` | provenKeys + uncertainPrefixes for cleanup/sync/generate |

### E.1a (on `feat/extractor`, not yet merged)

| Addition | Role |
|----------|------|
| `partitionTemplateHoles` | Split `${…}` into const-resolved vs runtime holes |
| `analyzeTemplateCall` | Shared per-call classification: `fully_resolved` \| `mixed_const_runtime` \| `runtime_only` |
| Wired in `scan.ts` + `javascript.ts` | One analysis path; **behavior parity** with pre-E.1a |

---

## 3. Classification matrix — today

| Call pattern | keySites | dynamic | proven? | uncertain prefix? |
|--------------|----------|---------|---------|-------------------|
| `t('a.b')` | `literal` | omitted | yes | no |
| `` t(`${NS}.title`) `` + `NS` in constMap | `template_resolved` | omitted | yes | no |
| `` t(`${M}.x.${expr}`) `` + `M` in constMap | `template_partial` | `template_interpolation` | no | yes (e.g. `orders.x`) |
| `` t(`${NS}.nav.${navPage}`) `` | `template_partial` | `template_interpolation` | no | yes |
| `t(greetingKey)` | skipped | `non_literal` | no | no* |
| `const { t } = useTranslation(); t('x')` | **missed** unless `t` imported | **missed** | no | no |
| `const tt = t; tt('x')` | **missed** | **missed** | no | no |
| `import { NS } from './constants'` + template | **partial** (NS not in file constMap) | dynamic | no | maybe |
| Commented `t(...)` | dynamic: `commented` | varies | no | policy-dependent |

\*Unless separate template site exists.

### Known limits (inventory)

- `extractor-reassignment-alias` — open
- `extractor-hook-return-destructuring` — planned
- `extractor-prose-first-arg-filter` — monitoring

---

## 4. Phase A — shipped (E.1–E.6 + D.1)

**Status:** shipped on `main` (W24) — see [`README.md`](./README.md) and [`shipped-slices.md`](../shipped-slices.md).

| Slice | End-state capability |
|-------|----------------------|
| **E.1** mixed-template fusion | Fused record per call; `dynamicRef` link; `staticPrefix`, `runtimeSegments`, `classification: mixed_const_runtime`; single uncertain-prefix contribution |
| **E.2** const-map | `let`/`readonly` patterns; block scope docs; re-export reads in same file; reject reassigned const |
| **E.3** non-template hints | Display hints for `t(local)` when local came from resolved template (no proven promotion) |
| **E.4** lexical safety | More prose/nesting/optional-chaining regression tests |
| **E.5** comment parity | keySites + dynamic agree on commented multiline templates |
| **E.6** JSON contract | `classification`, `staticPrefix` on analysis blob; `locales dynamic` grouping |
| **D.1** dynamic count split | `dynamicActive` / `dynamicCommented` in analysis + CLI/JSON |
| **Layer 7** provider registry | **On hold** — after AST tier + extension ([`provider-registry.md`](./provider-registry.md)) |

### Classification matrix — after Phase A

| Pattern | Change vs today |
|---------|-----------------|
| Mixed templates | **Same proven/uncertain outcome**; **one fused report row**; explicit `mixed_const_runtime` |
| Const-only templates | Unchanged |
| Literals | Unchanged |
| `useTranslation` / `tt = t` | **Still missed** (deferred to v2 HOC) |
| Cross-file `NS` | **Still missed** (deferred to v2 cross-file) |
| `t(variable)` | Still `non_literal`; optional hint if E.3 ships |

### User-visible delta

- Validate/cleanup/report JSON **richer** for mixed templates
- **Safer** cleanup (deduped uncertain prefixes)
- **Stable** issue codes and parity snapshots
- **Same** ~500 ms cold scan on web-scale projects

---

## 5. Phase B — end state after v2 `extractor/` program

**Starts after Phase A shipped.** Tiered via planned `extractor.depth` (names illustrative until config ships):

| Depth | Phases enabled | Cold scan budget (316-file ref) |
|-------|----------------|-------------------------------|
| `fast` (default) | Phase A only | **≤ 600 ms** |
| `balanced` | + HOC §A (hooks, 1-hop), light-dataflow | ≤ 750 ms |
| `deep` | + cross-file const, finite-keys (locale), HOC §B opt-in | ≤ 900 ms |
| `typed` | + TS/SWC program (unions, typed candidates) | user accepts seconds-scale |

### Phase-by-phase end state

| Phase | Doc | After implementation |
|-------|-----|----------------------|
| **HOC** | [`hoc.md`](./hoc.md) | `useTranslation`/`useTranslations` locals + `const tt = t` expand effective functions via **framework presets**; optional prop/HOC `t` with `extractor.hoc.enabled` |
| **Light dataflow** | [`light-dataflow.md`](./light-dataflow.md) | Same-file `const k = \`…\`; t(k)` gets `resolvedViaAssignment` hint; absorbs E.2/E.3 const/assignment work at v2 |
| **Cross-file** | [`cross-file.md`](./cross-file.md) | `import { NS } from './constants'` merges exported string consts into per-file effective map |
| **Finite keys** | [`finite-keys.md`](./finite-keys.md) | Under `staticPrefix`, emit `candidateKeys` from locale tree (`confidence: locale_inferred`); optional typed unions at `typed` depth |
| **Typed tier** | [`README.md`](./README.md) | Optional compiler-backed candidates; never default |

### Classification matrix — after Phase B (balanced depth)

| Pattern | vs Phase A |
|---------|------------|
| `` useTranslation(); t('x') `` | **Found** (preset) |
| `const tt = t; tt('x')` | **Found** (1-hop) |
| Cross-file `NS` import | **Often resolved** to `template_resolved` |
| `` t(`seo.routes.${id}.title`) `` | Same uncertain prefix + **candidateKeys** from locale (deep) |
| `t(propT)` in child component | Opt-in only (HOC §B) |
| `t(userInput)` | Still dynamic; no finite proof without `typed` + types |

---

## 6. Framework consistency (end state)

| Stack | Phase A | Phase B (`balanced`) | Notes |
|-------|---------|----------------------|-------|
| Plain `import { t }` | Full | Full | Baseline |
| react-i18next / next-i18next | Partial (import `t` only) | **Strong** (hook preset) | Init preset seeds config |
| next-intl (`useTranslations`) | Partial | **Strong** (preset) | Different hook name — table-driven |
| vue-i18n / nuxt | Import paths only | Needs Vue provider row (Layer 7) | Template `{{ $t }}` = separate provider |
| svelte-i18n | Limited | Preset + provider | `.svelte` in provider set today |
| Angular `translate` | Not in JS provider | Future provider | Out of v2 JS scope |

**Consistency guarantee:** Same **output contract** (`provenKeys`, `uncertainPrefixes`, `dynamicSites`, `classification`, optional `candidateKeys`) across frameworks; **detection** differs via preset/provider tables.

---

## 7. Performance model

### Reference benchmark (dogfood)

```
Project: ~316 .ts/.tsx files
validate --no-cache: ~511–555 ms
keyObservations: ~1177
dynamic: ~88
```

### Design rules (all phases)

1. Default path = regex only (paid once per file today).
2. New tiers **lazy** (skip hook scan if no `useTranslation` import).
3. Cross-file index = **one pass** over file list, not per call.
4. Project cache amortizes incremental runs.
5. PR gate: no tier ships without web-scale benchmark note.

---

## 8. Accuracy — qualitative before / after

| Scenario | Today (C.1) | After Phase A | After Phase B (`balanced`) |
|----------|-------------|---------------|----------------------------|
| `t('literal')` | ~99% | ~99% | ~99% |
| Same-file `` `${NS}.key` `` | ~95% | ~95% | ~97% (let/scope) |
| Mixed `` `${M}.${runtime}` `` | ~90% outcome, messy UX | ~90%, **clear UX** | ~90%, + candidates |
| React hook `t` | **Low** (many misses) | Low | **High** |
| Cross-file `NS` | Low | Low | **Medium–high** |
| `t(variable)` | Correctly uncertain | + hints | + hints |
| False deletes on cleanup | Low risk if policy=protect | **Lower** (deduped prefixes) | Lower |

**Not a percentage engine improvement globally** — largest gains are **React/Next hook patterns** and **shared constant barrels**, plus **explainability** everywhere.

---

## 9. Explicit non-goals (even after all phases)

- Whole-program SSA/dataflow by default
- Sound finite enumeration of `` t(`prefix.${userInput}`) `` without locale/types
- `useTranslation('ns')` namespace propagation as proven keys
- Multi-hop alias chains across files (unless `typed` + explicit policy)
- AST replacement of regex on default tier
- Vue template / Angular template syntax without dedicated providers

---

## 10. Risk register

| Risk | Mitigation |
|------|------------|
| Speed regression | Tier 0 default; lazy phases; benchmark gate |
| False proven keys | Never promote `candidateKeys`; confidence fields |
| FP on prop named `t` | HOC §B opt-in only |
| Cross-file wrong `NS` | Per-file overlay + provenance; collision tests |
| Parity break on refactor | `tests/parity/` + stable issue codes |
| Scope creep before launch | Phase A on `feat/extractor`; v2 docs only until A ships |
| Guardrail drift | Review [`guardrails.md`](./guardrails.md) per PR |

---

## 11. Implementation status snapshot

| Item | Status |
|------|--------|
| C.1 bindings, prose filter, comments | Shipped |
| E.1–E.6 mixed-template + JSON contract | Shipped (W24) |
| D.1 dynamic active/commented split | Shipped (W24) |
| Layer 7 registry | **On hold** — after AST + extension |
| v2 HOC / cross-file / finite-keys / light-dataflow | **Next** — planned docs |
| AST tier | Planned — after v2 tiers |

---

## 12. Recommended sequencing (locked)

```txt
NOW:
  v2 HOC (hooks) → light-dataflow → cross-file → finite-keys → HOC (props, opt-in) → AST tier
  → extension → provider registry (on hold)
```

---

## 13. One-paragraph pitch (for external review)

*i18nprune’s extractor is deliberately a fast regex-first scanner, not a typechecker. Today it excels at literals and same-file template const-folding (~500 ms on 300+ files) but misses React hook locals and cross-file namespace constants. Phase A hardens mixed-template semantics and cross-command JSON without slowing down. Phase B adds opt-in tiers—framework presets, cross-file const indexes, and locale-assisted candidate keys—so React/Next monorepos gain materially more coverage while default users keep the same speed. The design prioritizes safe cleanup (uncertain prefixes, no false proven keys) over claiming full static soundness.*

---

**Do not merge into:** user-facing `docs/` until behavior ships · parity rules apply to CLI `--json` and issue codes.
