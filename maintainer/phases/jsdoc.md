# JSDoc enforcement plan

Status: Active — apply per-slice during ongoing work; Tier-1 freeze gate before v1.

This is doctrine, not a sprint. It says **where JSDoc must exist**, **how long it should be**, and **what shape** — so contributors stop wasting time documenting helpers that don't matter and stop under-documenting the surfaces SDK consumers actually read.

---

## 1. Goal

Three concrete wins justify the cost:

1. **SDK tooltips** — third-party consumers of `@i18nprune/core` never read source. The hover popup over `runGenerate`, `defineConfig`, `RuntimeAdapters` *is* the docs.
2. **Canonical anchors** — when a phase doc names a primitive ("step 1 of translate-policy is `classifyTranslateFailure`"), the primitive's source file must say so. Stops re-derivation drift.
3. **Locked-decision receipts inline** — branch ordering, purity, runtime constraints, parity guarantees. The only place these get re-read at edit time is the file you're editing.

Anything that doesn't serve one of these three wins is **not in scope** for this plan.

---

## 2. Tiers

Length and required sections scale with priority. Internal helpers get the least; SDK entries get the most.

### Tier 1 — Required, full JSDoc

**Who:** anything a third party can `import { x } from '@i18nprune/core'`.

- Op entrypoints: `runGenerate`, `runTranslate`, future `runFill` (folded into generate `--resume`), `runSync`, `runReview`, `runQuality`, `runMissing`, `runValidate`, `runCleanup`, `runDoctor`, `runReport`, `runInit`, `runPatch`.
- Context factories: `createCoreContext`, `createTranslateContext`.
- Config public surface: `defineConfig`, `parseI18nPruneConfig`, the `I18nPruneConfig` type.
- Runtime: `RuntimeAdapters` interface and each method.
- Hooks: `GenerateHostHooks`, `GenerateRunHooks`, future per-op hook types.
- Errors: `I18nPruneError`, `TranslateRunInterruptedError`.
- Result envelope types: `CliJsonEnvelope`, `Issue`, `RunEvent`, `TranslationResult`, `LeafDecision`.

**Required sections:**

- One-paragraph summary (the *why*, not the *what*).
- `@param` for each input where the name doesn't carry the meaning.
- `@returns` when the return shape isn't obvious from the type.
- `@example` — one realistic call. Skip only when the call shape is `fn(x)`.
- `@remarks` — purity / runtime / concurrency / order constraints.
- `@throws` when applicable.

**Definition of done:** an SDK example under `examples/sdk/<op>/` can be written using only IDE tooltips. No `Read` of core required.

### Tier 2 — Required, summary + `@remarks`

**Who:** canonical primitives named in any phase doc (`core-architecture.md`, `translate-policy.md`, future). Internal but load-bearing.

- Reference example: `classifyTranslateFailure` (`packages/core/src/translator/policy/classify.ts`) — sets the bar.
- Examples this doc anticipates: `resolveTranslateConfig`, `ProviderHealthMonitor`, `resolveProviderActionFor`, `finalizeTranslationLeafMeta`, `createIdentityStreakGuard`, `IdentityStreakAbortError`, per-op `<op>/run.ts` orchestration entries.
- Issue code constants (each `ISSUE_*`): one-line JSDoc with the `docs.i18nprune.dev/issues/...` anchor it maps to. They appear in JSON envelopes; consumers see them.

**Required sections:**

- Summary paragraph (purpose + which phase doc step it implements).
- `@remarks` for the contract worth locking (purity, branch order, called-from constraints, etc.).
- `@param` / `@returns` only when not self-evident.
- `@example` optional — include only when the call shape isn't obvious.

**Definition of done:** the phase doc's named primitive can link to the file and find a matching contract paragraph in source.

### Tier 3 — Public types only, minimal

**Who:** types re-exported from `packages/core/src/types/**` barrels.

- One-paragraph summary on the type itself.
- Per-field JSDoc only when the field carries non-obvious semantics (e.g. `LeafDecision = 'translated' | 'review'` — yes; `count: number` — no).

**Definition of done:** hovering a field in user code shows useful intent, not just `string`.

### Tier 4 — Skip

**Who:**

- Anything not exported from any barrel.
- Exported but called by exactly one site.
- Pure mechanical glue (`merge`, `clone`, `mapEntries`).

A normal one-line code comment is fine where genuinely helpful. **No JSDoc walls.** Restating the type is forbidden.

---

## 3. Style rules

Apply to every tier. Violations are a review-block, not a nit.

1. **Don't narrate the code.** Say *why* and *when*, not *what*. Good: "Branch order is significant — earlier branches win." Bad: "Loops over the array and returns the first match."
2. **Don't restate the schema.** TypeScript already prints the type. JSDoc adds intent.
3. **`@example` is for non-obvious call shape only.** Skip when usage is `fn(x)`.
4. **Reference plan docs by path** (e.g., `maintainer/phases/translate-policy.md` step 1) so the file points back to the locked source of truth instead of carrying a competing copy.
5. **Reference issue codes by stable name** (`ISSUE_GENERATE_TRANSLATE_RATE_LIMITED`), never copy the human copy — it changes.
6. **Use `@remarks` for purity / concurrency / runtime constraints** ("pure", "no `process.*` access", "must be called from inside a `runXxx`").
7. **Mark internals with `@internal`** when they're tiered up only because plans name them — keeps them out of any future generated docs site.
8. **Length matches priority.** A Tier-1 entry deserves 30–60 lines if needed; a Tier-2 primitive usually fits in 10–20; a Tier-3 type often in 3–6. Don't pad to look thorough.

---

## 4. Anti-patterns to reject in review

- `/** Returns the user. */` above `getUser()` — pure narration.
- JSDoc that lists every property of a Zod-derived type — schema duplication.
- `@example` blocks longer than the function being documented.
- Marketing prose ("This powerful function...") instead of contract.
- JSDoc on Tier-4 helpers ("just so it's documented"). It isn't free.
- Stale `@remarks` referencing a removed flag or renamed export.

---

## 5. Cadence — how the work actually gets done

Big-bang doc PRs go stale fastest. The plan deliberately avoids one.

- **Per slice:** every file a slice creates or substantially edits must leave Tier-1/Tier-2 JSDoc in place before the slice closes. Existing slices already gate on typecheck + tests + parity; JSDoc joins that list. No separate JSDoc PR required.
- **Per phase:** a small sweep slice at the end of each phase touches Tier-1 entries the phase didn't otherwise hit. Time-boxed to a single slice; not a sprint.
- **Pre-v1 freeze gate:** Tier 1 must be 100% complete. Tier 2 must cover every primitive named in any phase doc still in scope. Tier 3 sweep last. Tier 4 stays untouched.

This means contributors never schedule "JSDoc work" as a standalone task; it's built into the work that's already happening.

---

## 6. Tier-1 / Tier-2 tracking

Status legend: `[x]` shipped to spec, `[~]` partial (summary exists, sections missing), `[ ]` not done.

### Tier 1 — SDK consumer surface

Op entries:

- [ ] `runGenerate` — `packages/core/src/generate/run.ts`
- [ ] `runTranslate` — `packages/core/src/translator/run.ts`
- [ ] `runSync` — TBD (Phase 3.a)
- [ ] `runReview`, `runQuality`, `runMissing`, `runValidate`, `runCleanup`, `runDoctor`, `runReport`, `runInit`, `runPatch` — TBD

Context factories:

- [ ] `createCoreContext`
- [ ] `createTranslateContext`

Config:

- [ ] `defineConfig` — `packages/core/src/config/schema/define.ts`
- [ ] `parseI18nPruneConfig` — `packages/core/src/config/schema/root.ts`
- [ ] `I18nPruneConfig` type — `packages/core/src/config/index.ts`

Runtime + hooks:

- [ ] `RuntimeAdapters`
- [ ] `GenerateHostHooks` — `packages/core/src/types/generate/generateRun.ts`
- [ ] `GenerateRunHooks` — `packages/core/src/types/generate/hooks.ts`

Errors + result types:

- [ ] `I18nPruneError`
- [ ] `TranslateRunInterruptedError` — `packages/core/src/translator/errors/interrupted.ts`
- [ ] `CliJsonEnvelope`, `Issue`, `RunEvent`, `TranslationResult`, `LeafDecision`

### Tier 2 — Canonical primitives named in phase docs

- [x] `classifyTranslateFailure` — translate-policy step 1
- [x] `finalizeTranslationLeafMeta` — translate-policy step 2
- [x] `createProviderHealthMonitor` — translate-policy step 3
- [ ] `resolveTranslateConfig` — core-architecture § 5.a
- [x] `resolveProviderActionFor` — translate-policy step 5
- [ ] `createIdentityStreakGuard` + `IdentityStreakAbortError`
- [ ] Issue-code constants block (`packages/core/src/shared/constants/issueCodes.ts`)

This list grows as new primitives get named in phase docs. When a primitive is renamed or deleted, the entry is removed in the same slice.

---

## 7. Out of scope for this plan

- User-facing docs in `apps/docs/`. Those have their own pipeline (`pnpm docs:sync`).
- READMEs in `examples/sdk/`. Those exist independently and link out to JSDoc rather than duplicate it.
- A generated docs site. Possible future use of JSDoc, but not a goal of this plan.
- Tier-4 helpers. Permanently out of scope. Don't bring them up in review.
