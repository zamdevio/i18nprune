# Extractor provider registry (non-JS languages)

**Status:** planned — start only after [`ast.md`](./ast.md) has a solid TS/JS typed path (MVP minimum; Program preferred if already landed).  
**Goal:** Add **non-JS/TS** file providers behind one core registry without destabilizing the regex-first JS pipeline or cold-scan budget.

**Prerequisites:** Heuristic v2 shipped ([`README.md`](./README.md)) · AST track open/closed per above.  
**Engineering map:** [`maintainer/systems/extractor.md`](../../systems/extractor.md) · **Architecture:** [`architecture.md`](./architecture.md) · **Guardrails:** [`guardrails.md`](./guardrails.md).

**Not in scope:** Replacing the JS/TS regex/`typed` path. Registry work is **extension-by-language**, not whole-program analysis.

---

## Language order

1. **TS/JS** — already covered by core + AST (`ast.md`); do not fork a second JS provider story here.
2. **Python** — first non-JS provider tranche.
3. **Other languages** — later, one provider at a time.

---

## Why a registry (not more JS regex)

Today:

- **keySites** + **dynamic** orchestrators call JS-like helpers directly.
- `extractor/dynamic/providers/index.ts` routes by extension → `javascript.ts` only.
- Non-`.ts/.tsx/.js/.jsx/.vue/.svelte` files produce **no** observations and **no** dynamic sites.

Registry adds **deterministic per-extension providers** so Python (then others) can ship incrementally without forking orchestrators.

---

## Stability exit criteria (must stay green)

Before first non-JS provider merges:

1. **JS matrix** — `.js/.jsx/.ts/.tsx/.vue/.svelte` fixtures green; parity snapshots unchanged except documented additive JSON fields.
2. **Mixed-template contract** — one uncertain-prefix contribution; `dynamicRef` link; template metadata on dynamic sites.
3. **Perf** — cold validate on ~316-file TS project stays **≤ 600 ms** (no regression from registry indirection).
4. **Core purity** — no `console.*` / `process.*` in extractor paths.
5. **Issue codes** — frozen; provider gaps use new optional metadata, not renamed codes.

---

## Provider interface (target)

Per file, one provider selected by **path extension** (no folder guessing):

```txt
ProviderInput  = { filePath, text, functions, constMap?, commentRanges? }
ProviderOutput = { observations: KeyObservation[], dynamicSites: DynamicKeySite[] }
```

| Rule | Detail |
|------|--------|
| Selection | Longest matching extension wins; explicit registry order as tie-break |
| Fallback | No provider → skip file (same as today for unknown extensions) |
| Shared analysis | JS provider reuses `analyzeTemplateCall`, `partitionTemplateHoles`, `dynamicTemplateFieldsFromAnalysis` |
| Comments | Providers emit `kind: 'commented'` dynamic rows; keySites omit commented calls (parity with JS) |
| Host boundary | Core returns data; CLI/report/share format |

**Registry location (proposed):**

```txt
packages/core/src/extractor/providers/
  registry.ts
  types.ts
  javascript/
  python/              # first non-JS tranche
  index.ts
```

---

## Suggested slices (when unblocked)

| ID | Deliverable |
|----|-------------|
| **P.1** | `ExtractorFileProvider` type + `registry.ts` + JS provider registered (no behavior change) |
| **P.2** | Unified per-file scan helper `{ observations, dynamicSites }` with shared `callId` / offset linking |
| **P.3** | Python provider MVP + fixtures |
| **P.4** | Capability flags on provider (`supportsTemplates`, `supportsConstMap`) |
| **P.5** | External plugin loading — **deferred** (built-in registry only) |

---

## Explicit non-goals

- Replacing regex-first JS path on `fast`
- Promoting `candidateKeys` to `provenKeys`
- Runtime plugin download / arbitrary code execution
- Cross-file const propagation (already shipped for JS static consts — see receipts)

---

## PR checklist (per slice)

- [ ] `pnpm typecheck` + `pnpm test`
- [ ] Provider unit tests + JS parity green
- [ ] [`maintainer/shipped/README.md`](../../shipped/README.md) receipt when slice ships
- [ ] User doc touch when behavior visible (`docs/architecture/extraction/` language matrix)
