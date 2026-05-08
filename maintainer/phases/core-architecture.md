# Core architecture — phased refactor plan

**Status:** Plan locked. **Phase 1 executes before [`translate-policy.md`](./translate-policy.md)**; subsequent phases run in parallel with policy and `fill` collapse.  
**Companion docs:** [`translate-policy.md`](./translate-policy.md) · [`providers.md`](./providers.md)  
**Anchors:** `packages/core/src/generate/` · `packages/core/src/translator/` · `packages/core/src/types/translator/` · `packages/cli/src/commands/generate/execute.ts` · `packages/cli/src/shared/translation/`

---

## 1. Why now

90%+ of the upcoming policy work touches **generate**. If we land that policy code in the CLI's `executeGenerate` first and refactor the architecture afterwards, we pay the cost twice: once writing CLI-shaped policy code, once rewriting it for core. By doing the generate-architecture refactor **before** the policy work, every line of policy code lands in its permanent home and the post-policy architecture work shrinks to "do the same thing for the other ops".

Pre-v1 freedom is used: no backwards-compat constraints on internal APIs. Behavior parity (CLI output, JSON envelope, exit codes) is preserved at every step.

---

## 2. Decisions (locked)

| # | decision |
|---|---|
| A1 | **One entry per op named `run.ts`**, re-exported from `index.ts`. Function name pattern: `runGenerate`, `runFill`, `runQuality`, etc. (`orchestrator.ts` is reserved — already used by translator pacing utilities). |
| A2 | **Config-driven entry params.** Entry takes the resolved config; reads source / existing target via host adapters; throws **`I18nPruneError`** for fatal IO / parse failures. SDK consumers detect failure with one type check. |
| A3 | **Typed return shape per op** (`GenerateOutput`, `FillOutput`, …) so consumers — CLI included — never reach into internals. |
| A4 | **CLI is a host.** It owns argv parsing, prompts, banners, logger calls, run-event emission. It does **not** own orchestration, retry loops, fallback, partial-resume, identity guards, file IO. Those move to core. |
| A5 | **Behavior parity rule.** During the refactor, `--json` envelope, human log lines, and exit codes on the fixture must be byte-identical before/after. Any deviation requires an explicit doc note in this file. Snapshot tests gate every PR. |
| A6 | **One slice per PR.** No bundling. `pnpm typecheck` + relevant tests + parity snapshot are merge gates. |
| A7 | **Folder conventions.** Shared types live in `packages/core/src/types/<domain>/` with an `index.ts` barrel. CLI never re-exports core types via shim files. |

---

## 3. End-state shape

After all phases ship, the SDK surface for `generate` is two functions:

```ts
import { resolveTranslateConfig, runGenerate } from '@i18nprune/core';

const { resolved, warnings } = resolveTranslateConfig({ config: cfg.translate });
warnings.forEach((w) => console.warn(w.message));

const out = await runGenerate({
  config: cfg,            // already-loaded I18nPruneConfig
  target: 'fr',
  metadata: true,
  hooks: { onTick: () => {} },
});

if (out.partial) {
  console.warn(`partial — run with --resume; ${out.markedForReview} marked for review`);
}
```

`runGenerate` reads source/target via adapters, runs the provider chain, applies policy, writes the target file (unless `dryRun`), and returns `GenerateOutput`. The CLI's `executeGenerate` becomes a thin shell: parse argv → build hooks (TTY prompts, progress bar, run events) → call `runGenerate` per target → print summary.

---

## 4. Phases at a glance

| phase | scope | when | order constraint |
|---|---|---|---|
| **1 — Generate-first refactor** | Core owns generate orchestration. CLI calls `runGenerate`. | **Before policy work.** | Hard prerequisite for phase 2. |
| **2 — Translate policy** | All 10 steps from [`translate-policy.md`](./translate-policy.md), landing on the new substrate. | After phase 1. | Hard prerequisite for `fill` collapse. |
| **3 — Other ops architecture** | `runFill`, `runQuality`, `runReview`, `runMissing`, `runSync`. Same pattern. | **Parallel with phase 2** (independent files). | Optional but recommended before phase 4. |
| **4 — `fill` collapse + CLI thinning** | Fold `fill` into `generate --resume`. Reduce CLI `execute.ts` files to thin shells. | After phases 2 + 3. | Final state. |

---

## 5. Phase 1 — Generate-first refactor

Three slices, executed in order. Each is a separate PR.

### 5.a — `resolveTranslateConfig` (additive, no CLI change)

**New files:**
- `packages/core/src/translator/config/resolveTranslateConfig.ts`
- `packages/core/src/translator/config/index.ts` (barrel)
- `packages/core/src/types/translator/config.ts` (`ResolvedTranslateConfig`, `ResolvedTranslateProviderRow`, `ResolveWarning`)

**API:**
```ts
export function resolveTranslateConfig(input: {
  config: I18nPruneConfig['translate'];
  env?: NodeJS.ProcessEnv;
  pin?: { providerId?: TranslationProviderId; workers?: number };
}): { resolved: ResolvedTranslateConfig; warnings: Issue[] };
```

**Replaces (in CLI, to be deleted in slice 5.b):**
- `resolveCliTranslateMaxParallelEffective`
- `resolveCliProviderRateLimitProfile`
- `resolveCliTranslateRateLimitEffective`
- `buildTranslateParallelLimitSuggestion`
- The provider-order math inside `resolveTranslationProviderOrder`

**Warnings.** Reuses `Issue` type with `severity: 'warning'`. Every default applied is recorded — none silent. CLI iterates and prints; SDK consumers iterate and decide.

**Tests.** Unit tests in `packages/core/src/translator/config/__tests__/resolveTranslateConfig.test.ts`. Parity test: existing `resolveProvider.test.ts` cases keep passing.

### 5.b — `runGenerate` entry + move orchestration into core

**New files:**
- `packages/core/src/generate/run.ts` (the entry)
- `packages/core/src/translator/identity/` (move from `packages/cli/src/shared/translator/identity.ts`)
- `packages/core/src/translator/fallback/` (extract retry loop currently in `executeGenerate`)

**Entry signature:**
```ts
export async function runGenerate(input: {
  config: I18nPruneConfig;
  target: string;                              // single target per call
  adapters?: HostAdapters;                     // defaults to Node fs/path
  metadata?: boolean;
  dryRun?: boolean;
  force?: boolean;
  pin?: { providerId?: TranslationProviderId; workers?: number };

  hooks?: {
    onTick?: TranslationTickProgressFn;
    onProviderAttempt?: (a: ProviderAttemptReport) => void;
    onIncomplete?: (i: IncompleteRunInfo) => Promise<IncompleteRunDecision>;
    onHandoffPick?: (offer: HandoffOffer) => Promise<TranslationProviderId | null>;
    onTranslatedLeaf?: (sourceText: string, translatedText: string, path: string) => void | Promise<void>;
  };

  identityGuard?: { enabled: boolean; thresholdRatio?: number };
}): Promise<GenerateOutput>;
```

**`GenerateOutput`:**
```ts
export type GenerateOutput = {
  next: unknown;                                // final locale JSON
  partial: boolean;
  providerAttempts: ProviderAttemptReport[];
  winnerProviderId: TranslationProviderId | null;
  fallbackCount: number;
  markedForReview: number;
  translateStats: TranslateRunPartialStats;
  issues: Issue[];                              // structured
  resumeHint?: { command: string };
  warnings: Issue[];                            // forwarded from resolveTranslateConfig
};
```

**What moves into `runGenerate`:**
- The per-provider `for` loop currently in `executeGenerate` (lines ~223-368).
- `TranslateRunInterruptedError` partial-resume logic.
- Identity-streak guard creation + handling.
- Provider-attempts aggregation.
- Translate-stats aggregation.

**What stays in CLI's `executeGenerate`:**
- argv parsing / target list parsing.
- TTY prompts (`promptMetaLocaleDetails`, `promptFullRetranslate`).
- Banner printing.
- `logger.info` / `logger.warn` calls (driven by `runGenerate` return data).
- Cursor lifts (`up(ctx.run, rows.gap)` etc.).
- `RunEmitter` integration.
- Final summary printing.

CLI's `executeGenerate` shrinks from ~360 lines to ~120 lines.

**Tests.** **Parity snapshot** is the gate:
1. Capture `--json` output of `i18nprune generate --target ar --metadata` on the sample fixture **before** the slice. Save as `tests/fixtures/sample-i18n/__snapshots__/generate.parity.json`.
2. After the slice, re-run; output must match byte-for-byte.
3. Same for human-output snapshot (stripped of timing fields).

If any byte changes, the slice is rejected unless A5 doc note is added.

### 5.c — Move file IO into core

**Touched files:**
- `packages/core/src/generate/run.ts` (read source, read existing target, write target + meta sidecar via adapters).
- `packages/core/src/types/host/index.ts` (typed `HostAdapters` if not already exported).

**What moves:**
- `readHostJsonUnknown(sourcePath, ctx.adapters.fs)` → core, called via `runGenerate`.
- Existing target read.
- Target write + meta sidecar write.

**What stays in CLI:**
- `resolveFromCwd` for argv-relative paths (CLI converts to absolute before calling `runGenerate`).
- `existsRuntimeFsSync` for sidecar checks (CLI still wants to know whether to prompt).

**Parity rule:** identical files written, identical file-not-found behavior, identical "skipped target already complete" log.

---

## 6. Phase 2 — Translate policy on the new substrate

The 10 steps in [`translate-policy.md`](./translate-policy.md) are unchanged in scope, but their **landing locations** are now:

| policy step | new location (post-phase-1) |
|---|---|
| 1 (classifier split) | `packages/core/src/translator/policy/classify.ts` |
| 2 (marker plumbing) | `packages/core/src/shared/translator/utils/pipeline.ts` (already there) |
| 3 (`ProviderHealthMonitor`) | `packages/core/src/shared/translator/utils/providerHealth.ts` |
| 4 (schema + types + init) | `packages/cli/src/config/schema.ts` (CLI-side, schema lives where Zod is configured) + `packages/core/src/types/translator/policy.ts` |
| 5 (policy resolver) | `packages/core/src/translator/policy/resolver.ts` |
| 6 (wire resolver) | `packages/core/src/generate/run.ts` (was `executeGenerate`) |
| 7 (handoff) | core: `packages/core/src/translator/policy/handoff.ts` (eligibility + offer); CLI: `packages/cli/src/shared/translation/handoff.ts` (TTY picker UI) |
| 8 (JSON envelope) | already in CLI summary, sources data from `GenerateOutput` |
| 9 (docs + tests) | unchanged |
| 10 (partial-run hook) | core: hook in `runGenerate`; CLI: prompt impl |

**`translate-policy.md` will be edited surgically** to reflect these locations once this doc lands. No scope change.

---

## 7. Phase 3 — Other ops architecture (parallel with phase 2)

Same `run.ts` pattern, behavior-parity rule, one slice per PR. Order suggestion (least risk first):

| op | existing CLI executor | core entry | rough size |
|---|---|---|---|
| `quality` | `commands/quality/run.ts` | `core/src/quality/run.ts` (rename internal helper) | small |
| `review` | `commands/review/run.ts` | `core/src/review/run.ts` | small |
| `missing` | `commands/missing/run.ts` | `core/src/missing/run.ts` | small |
| `sync` | `commands/sync/run.ts` | `core/src/sync/run.ts` | medium |
| `fill` | `commands/fill/executeFill.ts` | `core/src/fill/run.ts` | medium (collapses in phase 4) |

Each PR follows phase-1 sub-slice pattern: extract resolver → entry function → file IO last. Parity snapshot per op.

---

## 8. Phase 4 — `fill` collapse + CLI thinning

After phases 1–3 stable.

### 8.a — `fill` → `generate --resume`

`generate --resume` reads existing target locale; only translates leaves that are:
1. `needsReview: true` (when metadata on),
2. source-identical (always),
3. missing.

**CLI:** `fill` command becomes a deprecated alias that calls `runGenerate(..., { resume: true })`. (Or removed outright — pre-v1.)
**Core:** `runFill` → kept as thin `runGenerate(..., { resume: true })` shim for one release, then removed.

### 8.b — Thin CLI executors

After phase 4.a, `executeGenerate` should be ~80 lines:
```ts
export async function executeGenerate(ctx, merged, runtime?) {
  const { resolved, warnings } = resolveTranslateConfig({ config: ctx.config.translate, env: process.env, pin: { providerId: merged.provider, workers: merged.workers } });
  warnings.forEach((w) => logger.warn(w.message, ctx.run));

  const targets = resolveTargets(merged, ctx);  // argv → string[]
  const results: GenerateTargetJsonRow[] = [];

  for (const target of targets) {
    const session = createSessionProgress({ ... });
    const out = await runGenerate({
      config: ctx.config,
      target,
      metadata: merged.metadata,
      dryRun: merged.dryRun,
      force: merged.force,
      pin: { providerId: merged.provider, workers: merged.workers },
      hooks: {
        onTick: (i, t, p) => session.progress.tick(i, t, p),
        onProviderAttempt: (a) => emitProgress({ ... }),
        onIncomplete: confirmIncompleteTtyOrAutoWrite(ctx.run),
        onHandoffPick: pickProviderTtyOrFallback(ctx.run),
      },
    });
    session.finish();
    printGenerateFinalizeSummary(ctx.run, out);
    results.push(toRowFromOutput(target, out));
  }

  return { payload: { ... }, issues: [...] };
}
```

That's the target. We keep `execute.ts` (thin shell) — we don't delete it. The CLI is still needed for argv, prompts, banners, env stuff.

---

## 9. Behavior parity rules (the hard ones)

1. **Snapshot before / after every slice.** `tests/fixtures/sample-i18n` runs of `generate --target ar --metadata` and `fill --target ar --metadata` produce captured `--json` envelopes and stripped human-output. Re-run after each slice; bytes must match.
2. **No log line moves more than 1 line up/down.** Cursor-lift accounting depends on it.
3. **Exit codes unchanged.** `0` for ok, non-zero for `USAGE` / `IO` / `TRANSLATE` errors.
4. **Issue codes unchanged.** Existing `i18nprune.*` codes keep their meaning (we are NOT renaming `english_identical_leaves` etc.).
5. **`--quiet` / `--silent` / `--json` honor the same outputs.**
6. **Run events** (`run.progress.generate.*`) keep the same shape.

A slice that violates any of these gets rejected unless the PR explicitly documents the change (with `BREAKING:` prefix on the commit) and updates this doc.

---

## 10. Folder + type conventions

Codified — apply to every new file:

| domain | folder | exported via |
|---|---|---|
| Op orchestration entries | `packages/core/src/<op>/run.ts` | `<op>/index.ts` + root barrel |
| Op-specific helpers | `packages/core/src/<op>/*.ts` | `<op>/index.ts` |
| Shared translator helpers | `packages/core/src/shared/translator/utils/` | `namespaces/translator.ts` |
| Translator policy | `packages/core/src/translator/policy/` | `namespaces/translator.ts` |
| Translator config resolver | `packages/core/src/translator/config/` | `namespaces/translator.ts` |
| Public types | `packages/core/src/types/<domain>/index.ts` | `index.ts` barrel + root re-export |
| CLI command-shaped types | `packages/cli/src/types/command/` | CLI only |
| CLI host wiring | `packages/cli/src/shared/` | CLI only |

**Forbidden:**
- CLI re-export shim files for core types (`packages/cli/src/types/translator/rateLimit.ts`-style).
- `console.*` calls in core (`packages/core/src/**`).
- `process.*` access in core except via passed-in `env` parameter.
- File IO in core except via passed-in `HostAdapters`.

---

## 11. SDK consumer surface after each phase

After **phase 1**: SDK can run a generate without CLI.
```ts
const out = await runGenerate({ config, target: 'fr', metadata: true });
```
No policy yet — single provider per call (config-driven), one shot.

After **phase 2**: Same call, now with full policy / chain / handoff / partial-run.

After **phase 3**: Same pattern for `runQuality`, `runReview`, `runMissing`, `runSync`, `runFill`.

After **phase 4**: `runFill` is gone; `runGenerate({ ..., resume: true })` does the same thing.

---

## 12. Risks + mitigations

| risk | mitigation |
|---|---|
| Refactor introduces silent behavior drift | A5 + §9 parity snapshots; one slice per PR; typecheck + tests gated. |
| Scope creep into "fix everything while we're here" | This doc lists exactly what moves. Anything else is **out of scope** and noted as `Slice X — deferred` at most. |
| Phase 1 stalls policy work | Phase 1 is bounded at three sub-slices (5.a, 5.b, 5.c). Hard cap. |
| Solo developer fatigue | Slices are independently shippable (each merges on its own). Skip a day; the doc holds context for resuming cold. |
| `runGenerate` API churns during phase 2 | `GenerateOutput` is additive-only after phase 1 lands. New fields land as optional. |

---

## 13. Open items

- **`HostAdapters` exposure.** Phase 1.c moves file IO into core. If the existing `ctx.adapters` shape suffices, we re-export it. If we need a tighter typed export for SDK consumers, we add it in phase 1.c. Decision deferred to that slice.
- **Run events as the canonical observability surface** (was Slice G in the prior proposal). Folded into phase 4 cleanup, not a separate slice.
- **`HostAdapters` for non-Node runtimes.** Out of scope for v1 unless an actual consumer asks.
