# `translate.policy` — final plan (ready to execute)

**Status:** Steps **1–10** are implemented in-tree (classifier → schema → resolver → `runGenerate` wiring → handoff → JSON route detail → partial-run hook / envelope per §13 → docs/tests). Follow-ups (e.g. **`generate --resume`**, **`retry_provider`**) are tracked in §13 / companion docs. Original prerequisite: Phase 1 **`runGenerate`** substrate — satisfied.  
**Companion:** [`providers.md`](./providers.md) — Session A shipped baseline.  
**Anchors:** `packages/cli/src/config/schema.ts` · `packages/cli/src/types/config/index.ts` · `packages/core/src/init/index.ts` · `packages/core/src/shared/translator/` · `packages/core/src/translator/` (new — created in phase 1) · `packages/core/src/generate/run.ts` (new — created in phase 1) · `packages/cli/src/shared/cursor/`

---

## 1. Purpose

Replace the current 3-key `translate.policy` with a forward-only outcome → action model that names every reaction the orchestrator can take, **never fails a run on a single bad leaf**, and gives users (and `--json` consumers) a clear contract per failure class.

Pre-v1: **no backwards compatibility.** Old `'backoff' | 'fail'` and `'retry' | 'fail'` enums are removed entirely.

---

## 2. Decisions (locked)

| # | decision |
|---|---|
| D1 | Single verb per outcome (constrained enum), object-form upgrade reserved for future. |
| D2 | `onRateLimitResponse` → **`onRateLimit`**. Naming kept minimal across the block. |
| D3 | **No `fallbackChain`.** `translate.providers[]` order **is** the auto chain. `enabled: false` skips a provider. CLI `--provider` / env pin moves an id to the front of the chain (already shipped). |
| D4 | `maxAttempts` is **cross-provider, per leaf**. **On cap, do NOT abort the run.** Mark the leaf and continue. |
| D5 | `onIdentityOutput: 'flag'` and `maxAttempts` cap hit share one mechanism: write the **source value** as the leaf; set **`needsReview: true`** only when `--metadata` is on. **No new marker key** — `needsReview` is reused as the unified attention signal across user-flagged review, identity-output flagging, and cap-hit cases. Keeps the leaf shape tight. |
| D6 | `handoff` picker uses the **full built-in provider catalog**, not `providers[]`. Eligibility = required fields runnable right now. `google` first, marked **(recommended)**. Currently-failing provider excluded. |
| D7 | Schema `.strict()`, all keys optional, defaults safe. Adding/removing keys later is a single-file change. |
| D8 | Translator `runtime` block (`{ attempts, retries }`) is **not extended.** All policy reporting comes from existing per-target route summary + leaf state. |
| D9 | Run never aborts because of one leaf. `abort` verb fires only on auth-class / `unknown_hard_stop` / explicit user policy. |

---

## 3. Schema

```ts
translate: {
  providers: [
    /* The order of this array IS the auto-routing chain.
     * - routing: 'auto' walks providers top-to-bottom on retryable failures.
     * - --provider / I18NPRUNE_TRANSLATE_PROVIDER pins an id to the FRONT of
     *   this chain (it does NOT disable fallback when routing is 'auto').
     * - Set enabled: false (or comment the row) to skip a provider.
     */
    { id: 'google',   enabled: true /* ... */ },
    { id: 'mymemory', enabled: true /* ... */ },
  ],
  policy: {
    routing:               'single' | 'auto'                          // chain mode
    onRateLimit:           'backoff' | 'retry' | 'fallback' | 'abort' // 429 burst
    onTransientFailure:    'retry'   | 'fallback' | 'abort'           // 5xx / network blip
    onQuotaExceeded:       'fallback' | 'prompt' | 'abort'            // daily / monthly cap
    onAuthFailure:         'abort'    | 'prompt'                       // 401 / 403
    onProviderUnavailable: 'fallback' | 'abort'                        // DNS / wall of 5xx
    onIdentityOutput:      'flag'     | 'fallback' | 'abort'           // translator returned source unchanged
    onIncompleteRun:       'confirm' | 'write' | 'discard'             // run can't finish all leaves
    maxAttempts:           number                                     // cross-provider, per leaf
    handoff:               'auto' | 'on' | 'off'                       // TTY mid-run rescue prompt
  }
}
```

All keys optional. Zod `.strict()` rejects typos.

---

## 4. Verb dictionary

| verb | meaning | requires |
|---|---|---|
| `retry`    | Re-attempt the leaf on the **same** provider. Counts toward `maxAttempts`. | — |
| `backoff`  | Honor `Retry-After` / provider hint via `ProviderHealthMonitor`; pause start gate for that provider; then `retry`. | health monitor (§7) |
| `fallback` | Move to next provider in `providers[]`; resume from partial locale (already shipped). | `routing: 'auto'` |
| `prompt`   | TTY: open `handoff` picker (§8). Non-TTY: degrade to `fallback` if eligible, else `abort`. | `eligible(run)` |
| `abort`    | Stop the run with a structured issue. Used only by auth / unknown hard-stop / explicit policy. | — |
| `flag`     | (`onIdentityOutput`) Write source value as the leaf; mark per §5. Continue. | — |

---

## 5. Marker mechanism — reuse `needsReview`

Cap-hit leaves and `flag`-outcome leaves share one mechanism with a **dual signal**. **No new key** is introduced — the existing `needsReview` is promoted to the unified attention marker:

| `--metadata` | leaf written as |
|---|---|
| **on**  | source value **+** `needsReview: true` (alongside the existing structured leaf shape) |
| **off** | source value **as-is**, no marker key |

Why reuse `needsReview` instead of adding `needsTranslationAgain`:

- One key, one mental model. `needsReview` already means "this leaf needs human / CLI attention before it can be considered done". That covers user-flagged review, identity-output flagging, and cap-hit cases without scattering markers.
- Keeps the structured leaf shape tight for thousands of projects of varying scale.
- Consumers (`quality` / `review` / `validate` / `report` / `fill` / future `generate --resume`) already understand `needsReview`. No new schema for them.

Detection downstream stays a dual signal:

- **With marker** → explicit detect via `needsReview: true` in all read-side commands.
- **Without marker** → already-shipped source-identical detector picks it up (same as today).

**Core contract.** Core never writes the marker unilaterally. The translator returns a `LeafDecision = 'translated' | 'review'`; the CLI write path inspects `getCliMetadataFlag()` to decide whether to persist `needsReview: true`. No core API breakage.

**Type touch points:**
- `packages/core/src/types/translator/result.ts` — add `decision?: 'translated' | 'review'` (optional, additive).
- `packages/core/src/shared/translator/utils/pipeline.ts` (`finalizeTranslationLeafMeta`) — when `decision === 'review'`, set `needsReview: true` on the structured leaf.
- `packages/core/src/shared/localeLeaves/` — `normalizeStructuredLeaf` already round-trips `needsReview`; nothing to add.
- `packages/cli/src/shared/translation/` — gate marker write behind `--metadata`.

---

## 6. Defaults

| key | default | rationale |
|---|---|---|
| `routing` | `'single'` | matches today's safe default |
| `onRateLimit` | `'backoff'` | most providers honor `Retry-After` |
| `onTransientFailure` | `'retry'` | network blips usually self-heal |
| `onQuotaExceeded` | `'fallback'` | daily caps deserve chain switch |
| `onAuthFailure` | `'abort'` | never silently swap on credential failure |
| `onProviderUnavailable` | `'fallback'` | DNS / 5xx wall → degrade |
| `onIdentityOutput` | `'flag'` | preserves source-identical detection downstream |
| `onIncompleteRun` | `'confirm'` | TTY = prompt; non-TTY = auto-promote to `'write'` (loss of work is worse than auto-writing partial) |
| `maxAttempts` | `providers.length` | one shot per provider in chain (round-trip if `--workers` retries) |
| `handoff` | `'auto'` | TTY = prompt when `routing: 'single'`; non-TTY = silent fallback |

---

## 7. Backoff sub-algorithm — `ProviderHealthMonitor`

Lives in `packages/core/src/shared/translator/utils/providerHealth.ts` (new). Sits next to `createStartRateGate`.

```ts
ProviderHealthMonitor:
  onAttemptResult(providerId, outcome, hint?: { retryAfterMs })
  shouldDelayStartFor(providerId): number     // ad-hoc extra delay ms
  consecutiveBackoffsFor(providerId): number
  shouldEscalate(providerId, policy): boolean // backoff exhausted → escalate
```

Wiring:
- The existing **start-rate gate** consults `shouldDelayStartFor` for per-provider extra delays on top of `rpm` / `rps` / `intervalMs` pacing.
- The **policy resolver** (§9) calls `shouldEscalate` to upgrade `backoff` → `fallback` after N consecutive backoffs (N derived from `maxAttempts` / `providers.length`).
- Contained: zero CLI breakage, zero new public API on the translator.

---

## 8. Handoff behavior

Pool: built-in catalog (`google`, `mymemory`, `libre`, `deepl`, `llm`). **Not** `translate.providers[]`.

Eligibility:
- `google`, `mymemory`, `libre` → always eligible (no secret required).
- `deepl` → eligible iff `apiKey` resolvable (env `I18NPRUNE_TRANSLATE_DEEPL_API_KEY` or config row).
- `llm` → eligible iff `apiKey` + `baseUrl` + `model` all resolvable.
- Currently-failing provider excluded from the list.

Order: `google` first **(recommended)** when present and eligible, then catalog order. If `google` itself is the failing provider, it's excluded and the next eligible row is shown without a `(recommended)` tag (no replacement re-ranking). Ineligible providers are hidden (no "missing key" noise).

**Empty-pool terminal state.** If after filtering no eligible provider remains, the policy returns a structured `no_eligible_provider` issue and aborts cleanly with a one-line explanation of which providers were filtered and why (e.g. `deepl` skipped: missing `apiKey`). The run does not hang and does not crash.

Resolved row: a small new `synthesizeProviderRow(id)` builds a runnable row from defaults + env at pick time. Run resumes on the picked provider via the existing partial-locale resume path.

**Stderr layout (TTY).** When the prompt fires, the CLI uses the existing `shared/cursor` primitives in this order: **`rewindStderrForRedraw`** the active progress block → render the picker → on user pick, **redraw the progress bar fresh**. No bespoke ANSI code; no overlap with the live bar.

Behavior matrix (TTY = `eligible(run)` from `shared/cursor`):

| `routing` | `handoff` | TTY | retryable failure → |
|---|---|---|---|
| `single` | `auto` | yes | **prompt** picker |
| `single` | `auto` | no  | apply policy verbs (likely `abort` if no chain) |
| `single` | `on`   | yes | **prompt** picker |
| `single` | `on`   | no  | warn + `abort` |
| `single` | `off`  | any | apply policy verbs only |
| `auto`   | `auto` | yes | **silent fallback** (auto wins, no interruption) |
| `auto`   | `auto` | no  | silent fallback |
| `auto`   | `on`   | yes | **prompt** picker (overrides auto-chain) |
| `auto`   | `on`   | no  | silent fallback |
| `auto`   | `off`  | any | silent fallback |

---

## 9. Implementation steps

**Prerequisite:** [`core-architecture.md`](./core-architecture.md) **Phase 1** (`runGenerate` + `resolveTranslateConfig` + identity guard moved to core) is shipped. The locations below assume that substrate.

| # | step | location | parallelizable |
|---|---|---|---|
| 1 | **Internal classifier split** — `rate_limited` vs `quota_exceeded`; `transient_network` vs `provider_unavailable`; `non_retryable_error` → `auth_failure` / `malformed_response` / `unknown_hard_stop`. | `packages/core/src/translator/policy/classify.ts` (new) — CLI imports from core. | yes |
| 2 | **Marker plumbing** — `LeafDecision = 'translated' \| 'review'` in core result; `finalizeTranslationLeafMeta` writes `needsReview: true` when the decision is `'review'`; CLI gate via `--metadata` flows through `runGenerate` `metadata` param. **Reuses existing `needsReview` — no new key.** | `packages/core/src/shared/translator/utils/pipeline.ts`, `packages/core/src/types/translator/result.ts`; gate in `packages/core/src/generate/run.ts`. | yes |
| 3 | **`ProviderHealthMonitor`** + start-gate hook for `Retry-After`. | `packages/core/src/shared/translator/utils/providerHealth.ts` (new) + small edit in `orchestration.ts`. | yes |
| 4 | **Schema + types + init template + JSDoc.** Drop old enums; introduce locked schema; emit the `providers[] order = chain` comment in init templates. | `packages/cli/src/config/schema.ts` (Zod), `packages/core/src/types/translator/policy.ts` (new — types), `packages/core/src/init/`. | after 1 |
| 5 | **Policy resolver** — `resolveProviderActionFor(outcome, policy, health, routing)`. Single source of truth used by `runGenerate` (and future `runFill` / `--resume`). | `packages/core/src/translator/policy/resolver.ts` (new). | after 1, 2, 3, 4 |
| 6 | **Wire resolver into `runGenerate`.** Replace the simple "retryable → next provider" loop (already in core after phase 1) with the resolver. | `packages/core/src/generate/run.ts`. | after 5 |
| 7 | **Handoff** — split surface: core owns eligibility + offer construction; CLI owns the TTY picker UI (`shared/cursor` lift, prompt). | core: `packages/core/src/translator/policy/handoff.ts` (new); CLI: `packages/cli/src/shared/translation/handoff.ts` (new). | after 5 |
| 8 | **JSON envelope route summary** — add `outcome` per attempt and `markedForReview` count per target (sourced from `GenerateOutput`). | CLI run rows; data already in `runGenerate` return. | after 6 |
| 9 | **Docs + tests** — `docs/config/translate.md` policy table, verb dictionary, defaults; vitest cases per verb × outcome; smoke fixture for handoff. | docs + tests. | after 6, 7 |
| 10 | **Partial-run write hook (§13).** `onIncompleteRun` policy key drives `runGenerate` when a target stops mid-run; `GenerateRunHooks.onIncomplete` on **`confirm`**; CLI prompt + non-TTY/`--yes`/`--json` → write; JSON **`partial`**, **`resumeHint`**, payload **`markedForReview`** sum, per-row **`partial`**. | core + CLI + docs + tests. | yes |

Steps 1–4 land in parallel. Steps 5–10 sequence as listed. **`retry_provider`** / **`generate --resume`** remain follow-ups (§10 kill-fill + §13 notes).

---

## 10. Follow-up slice (after this plan ships): kill `fill`

Reasoning (locked, deferred):

- One central translation consumer in CLI = `generate` (with `--resume`).
- Core gets tidier — `fill`-specific scaffolding folds into `generate`.
- Third-party SDK story simplifies to one entry point.

`generate --resume` reads the existing target locale and only translates leaves that are:
1. `needsReview: true` (when metadata is on),
2. source-identical (always — also covers the metadata-off case from §5),
3. missing.

Sequenced as a clean follow-up PR, **after** this policy plan is fully shipped. Not tangled with this work.

---

## 11. What stays untouched

- `routing: 'auto'` chain selection + CLI/env pin promotion.
- `TranslateRunInterruptedError` partial-locale resume.
- `shared/cursor` lift policy + presets (powers `prompt` verb gate).
- Per-provider `rateLimit` defaults / merge order / start-rate gate.
- Confidence rounding to 2 decimals.
- `i18nprune providers` read-only.
- Source-identical terminology pass.
- Translator `runtime` block — kept at `{ attempts, retries }`, no extension.

---

## 12. Open items before execution

None blocking. All locked:

- **`maxAttempts` default = `providers.length`.** Tight, predictable; one shot per provider in the chain. Users who want more retries set it explicitly. Single-number tweak in `init/index.ts` if revisited.
- **Marker key reuse.** `needsReview` is the unified attention marker (no new key) — see §5.
- **Handoff stderr layout.** `rewindStderrForRedraw` → picker → redraw progress (see §8).
- **Empty handoff pool** → structured `no_eligible_provider` abort with filter explanation (see §8).

---

## 13. Partial-run write hook (step 10)

**Why.** Today `TranslateRunInterruptedError` carries `partialLocaleJson`, but the decision to write or discard it lives in CLI code. SDK consumers can't share that logic. This step promotes the decision to a first-class **core-side hook** with a policy key, so CLI and any third-party API user share one mechanism: *"the run can't complete — write what we have, mark the rest, advise `--resume`?"*

### Policy key

```ts
onIncompleteRun: 'confirm' | 'write' | 'discard'
```

| verb | meaning | non-TTY |
|---|---|---|
| `confirm` | TTY: prompt **"Some leaves were not translated. Write partial target now? Run with `--resume` later to finish. [Y/n]"**. | Auto-promotes to `write`. |
| `write`   | Always write partial. Always emits an info log with the resume hint. | Same. |
| `discard` | Throw `TranslateRunInterruptedError`; nothing is written. | Same. |

**Default:** `'confirm'`.

### What "partial" means

A complete, valid target locale JSON where:

- Translated leaves = real translations (with confidence, etc., per existing pipeline).
- Un-translated leaves = source value (so the JSON is structurally complete and mergeable).
- When `--metadata` is on: un-translated leaves get `needsReview: true` (consistent with §5).
- `.meta.json` written normally.
- `--json` envelope adds `partial: true`, `markedForReview: <count>`, and `resumeHint: 'generate --resume'`.

### CLI surface

After the progress bar clears, one info line:

```
generate (so): partial — 1043/1140 translated (97 marked for review). Run `i18nprune generate --target so --resume` to finish.
```

The TTY confirm prompt uses the existing **`eligible(run)`** gate + `shared/cursor` lift (`rewindStderrForRedraw` → prompt → redraw progress, same flow as the handoff picker in §8).

### Core surface (additive, no breakage)

```ts
// packages/core/src/types/translator/incomplete.ts (new)
export type IncompleteRunDecision = 'write' | 'discard';

export type IncompleteRunInfo = {
  completedLeaves: number;
  totalLeaves: number;
  providersAttempted: ProviderAttemptReport[];
  lastError: unknown;
};

// packages/core/src/generate/localeTranslate.ts (option extension)
export type BuildTranslatedLocaleOptions = {
  // ...existing fields
  onIncomplete?: (info: IncompleteRunInfo) => Promise<IncompleteRunDecision>;
};
```

Decision flow inside core:

1. If policy is `'discard'` → throw (today's behavior).
2. If policy is `'write'` → return partial locale; CLI writes it.
3. If policy is `'confirm'`:
   - If `onIncomplete` callback is supplied → call it; honor return value.
   - If callback is **not** supplied → treat as `'write'` (SDK default; safer than throwing away N completed translations).

CLI provides one `onIncomplete` that prompts in TTY and returns `'write'` non-TTY. SDK consumers can supply their own UI or skip and accept `'write'`.

### Type touch points

- New file: `packages/core/src/types/translator/incomplete.ts` (types above).
- Re-export from `packages/core/src/types/translator/index.ts`.
- Re-export from `packages/core/src/namespaces/translator.ts`.
- Re-export from `packages/core/src/index.ts` (top-level barrel).
- CLI re-exports under `packages/cli/src/types/translator/` are **not** added — call sites import directly from `@i18nprune/core` (consistent with the rate-limit shim cleanup we did earlier).
