# Extractor provider registry (Layer 7 — non-JS languages)

**Status:** **on hold** — implement only after:

1. **v2 extractor tiers** shipped through **AST tier** ([`ast-tier.md`](./ast-tier.md))
2. **VS Code extension** released and stable ([`../extension/README.md`](../extension/README.md))
3. No open regressions on parity / issue codes for the above

**Goal:** Add **non-JS/TS** file providers behind one core registry without destabilizing the regex-first JS pipeline or cold-scan budget.

**Prerequisites (shipped):** C.1 · E.1–E.6 · D.1 — see [`README.md`](./README.md).  
**Engineering map:** [`maintainer/systems/extractor.md`](../../systems/extractor.md) · **Architecture:** [`architecture.md`](./architecture.md) · **Guardrails:** [`guardrails.md`](./guardrails.md).

**Not in scope here:** v2 accuracy program ([`hoc.md`](./hoc.md), [`cross-file.md`](./cross-file.md), etc.). Registry work stays **extension-by-language**, not whole-program analysis.

---

## Why a registry (not more JS regex)

Today:

- **keySites** + **dynamic** orchestrators call JS-like helpers directly.
- `extractor/dynamic/providers/index.ts` routes by extension → `javascript.ts` only.
- Non-`.ts/.tsx/.js/.jsx/.vue/.svelte` files produce **no** observations and **no** dynamic sites.

Layer 7 adds **deterministic per-extension providers** so Python, Ruby, etc. can ship incrementally without forking orchestrators.

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
  python/              # first non-JS tranche (placeholder)
  index.ts
```

---

## Suggested slices (when unblocked)

| ID | Deliverable | Estimate |
|----|-------------|----------|
| **P.1** | `ExtractorFileProvider` type + `registry.ts` + JS provider registered (no behavior change) | ~3–4h |
| **P.2** | Unified per-file scan helper `{ observations, dynamicSites }` with shared `callId` / offset linking | ~2–3h |
| **P.3** | Python provider MVP + fixtures | ~6–8h |
| **P.4** | Capability flags on provider (`supportsTemplates`, `supportsConstMap`) | ~2h |
| **P.5** | External plugin loading | **deferred** — built-in registry only |

---

## Explicit non-goals (Layer 7)

- Replacing regex-first JS path on Tier 0
- Cross-file const propagation (see [`cross-file.md`](./cross-file.md))
- Promoting `candidateKeys` to `provenKeys`
- Runtime plugin download / arbitrary code execution

---

## PR checklist (per slice)

- [ ] `pnpm typecheck` + `pnpm test`
- [ ] Provider unit tests + JS parity green
- [ ] [`maintainer/phases/shipped-slices.md`](../shipped-slices.md) receipt when slice ships
- [ ] User doc touch when behavior visible (`docs/architecture/extraction/` language matrix)
