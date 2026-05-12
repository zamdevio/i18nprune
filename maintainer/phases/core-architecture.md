# Core architecture — phased refactor plan

**Status:** Plan locked. **Phase 1 executes before [`translate-policy.md`](./translate-policy.md)**; subsequent phases run in parallel with policy and `fill` collapse.  
**Companion docs:** [`translate-policy.md`](./translate-policy.md) · [`providers.md`](./providers.md)  
**Anchors:** `packages/core/src/generate/` · `packages/core/src/translator/` · `packages/core/src/types/translator/` · `packages/cli/src/commands/generate/execute.ts` · `packages/cli/src/shared/translator/`

---

## 1. Why now

90%+ of the upcoming policy work touches **generate**. If we land that policy code in the CLI's `executeGenerate` first and refactor the architecture afterwards, we pay the cost twice: once writing CLI-shaped policy code, once rewriting it for core. By doing the generate-architecture refactor **before** the policy work, every line of policy code lands in its permanent home and the post-policy architecture work shrinks to "do the same thing for the other ops".

Pre-v1 freedom is used: no backwards-compat constraints on internal APIs. Behavior parity (CLI output, JSON envelope, exit codes) is preserved at every step.

---

## 2. Decisions (locked)

| # | decision |
|---|---|
| A1 | **One entry per op named `run.ts`**, re-exported from `index.ts`. Function name pattern: `runTranslate` (translate primitive), `runGenerate`, `runQuality`, `runReview`, `runMissing`, `runSync`, `runCleanup`. (`orchestrator.ts` is reserved — already used by translator pacing utilities; `runFill` is intentionally not in the list — see §8 / §11.) |
| A2 | **Config-driven entry params.** Entry takes the resolved config; reads source / existing target via host adapters; throws **`I18nPruneError`** for fatal IO / parse failures. SDK consumers detect failure with one type check. |
| A3 | **Typed return shape per op** (`GenerateOutput`, `FillOutput`, …) so consumers — CLI included — never reach into internals. |
| A4 | **CLI is a host.** It owns argv parsing, prompts, banners, and rendering policy. Core owns operation orchestration **and operation message copy** via `run.message` events; hosts decide whether to show, collect, ignore, or map those messages into their own UI. CLI must not duplicate core-op info/warn/detail copy after an op is migrated. |
| A5 | **Behavior parity rule.** During the refactor, `--json` envelope, human log lines, and exit codes on the fixture must be byte-identical before/after. Any deviation requires an explicit doc note in this file. Snapshot tests gate every PR. |
| A6 | **One slice per PR.** No bundling. `pnpm typecheck` + relevant tests + parity snapshot are merge gates. |
| A7 | **Folder conventions.** Shared types live in `packages/core/src/types/<domain>/` with an `index.ts` barrel. CLI never re-exports core types via shim files. |

---

## 3. End-state shape

After all phases ship, every op is one core entry. Three layers compose:

| layer | purpose | examples |
|---|---|---|
| **L1 — per-domain resolvers** (pure) | normalize one config block, return defaults applied + warnings | `resolveTranslateConfig`, `resolveCoreConfig`, `resolveScanExcludeConfig` |
| **L2 — host context** (pure, optional) | bundle `config + adapters + env + run options + paths` once for ergonomics across multiple op calls | `createTranslateContext({ config, adapters, env })`, `createCoreContext({ config, adapters, env, run? })` |
| **L3 — op entries** (pure orchestration) | call L1 resolvers, read I/O via L2 adapters, return typed output | `runTranslate(ctx, opts)` (translate primitive), `runGenerate(ctx, opts)`, `runQuality`, `runReview`, `runMissing`, `runSync` |

Each L3 entry throws `I18nPruneError` (with stable `code`) on fatal config / env / IO failures so SDK consumers detect failure with one type check.

### Hard rules

- **Adapters are always passed explicitly. No defaults, no kind-sniffing.** Core does NOT auto-resolve `createNodeRuntimeAdapters()` when omitted. SDK consumers import the matching factory from `@i18nprune/core/runtime/node` (or `/web`, `/edge`) and pass it. The CLI does the same: it imports `createNodeRuntimeAdapters` and passes the result.
- **`env` is always passed explicitly.** Core never touches `process.*`. Pass `process.env` (Node), Worker bindings (Workers), or `{}` (tests).
- **`runTranslate` is the canonical translation primitive.** Any consumer who just wants strings translated uses it directly — no `I18nPruneConfig`, no project layout, no file IO. `runGenerate` is built on top of `runTranslate` for the locale-shape + IO use case.
- **Every L3 entry takes `(ctx, opts)`.** Single bundled context object (`TranslateContext` for the translate primitive, `CoreContext` for project ops); per-call options are the second argument. No more passing `config / adapters / env / run` separately at every call site.
- **One canonical entry point per use case.** No proliferation of half-overlapping APIs.

### SDK call shapes

**A. Translate strings only — no project, no files (`runTranslate`):**
```ts
import { createTranslateContext, runTranslate } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

const ctx = createTranslateContext({
  config: {
    primary: 'google',
    providers: [{ id: 'google', enabled: true }],
    policy: { routing: 'auto' },
  },
  adapters: createNodeRuntimeAdapters(),
  env: process.env,
});

const out = await runTranslate(ctx, {
  texts: ['Welcome', 'Sign in', 'Logout'],
  targetLang: 'fr',
  sourceLang: 'en',
});

out.translations;       // [{ ok: true, value: 'Bienvenue', providerId: 'google' }, … ]
out.providerAttempts;   // [{ providerId: 'google', outcome: 'success' }]
out.warnings;           // forwarded from resolveTranslateConfig
```

**B. Generate a full target locale (`runGenerate`):**
```ts
import { createCoreContext, runGenerate } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

const ctx = createCoreContext({
  config: cfg,                              // already-loaded I18nPruneConfig
  adapters: createNodeRuntimeAdapters(),
  env: process.env,
});

const out = await runGenerate(ctx, {
  target: 'fr',
  metadata: true,
});

if (out.partial) {
  console.warn(`partial — run with resume: true; ${out.markedForReview} marked for review`);
}
```

**C. Resume / top-up (replaces `fill`):**
```ts
const filled = await runGenerate(ctx, {
  target: 'fr',
  resume: true,                             // only translates needsReview / source-identical / missing
  metadata: true,
});
```
This is the substrate that **replaces the `fill` command** in phase 4 (see §8). Same semantics as today's `i18nprune fill --target fr --metadata`; one entry point covers both initial generate and partial top-ups.

**D. Cloudflare Worker / Edge:**
```ts
import { createCoreContext, runGenerate } from '@i18nprune/core';
import { createWebRuntimeAdapters } from '@i18nprune/core/runtime/web';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const ctx = createCoreContext({
      config,
      adapters: createWebRuntimeAdapters({ kv: env.LOCALES, fetch: env.fetch }),
      env,                                  // Worker bindings, not process.env
    });
    const out = await runGenerate(ctx, {
      target: new URL(req.url).searchParams.get('target')!,
      metadata: true,
    });
    return Response.json(out);
  },
};
```

**E. Multi-op flow via shared context (CLI uses this internally):**
```ts
import { createCoreContext, runGenerate, runQuality } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

const ctx = createCoreContext({
  config: cfg,
  adapters: createNodeRuntimeAdapters(),
  env: process.env,
});

const generated = await runGenerate(ctx, { target: 'fr', metadata: true });
const quality   = await runQuality (ctx, { target: 'fr' });
```

Inside `runGenerate`, the helper `translateContextFromCore(ctx): TranslateContext` projects `CoreContext` down to a `TranslateContext` so it can call `runTranslate(translateCtx, leafOpts)` — same primitive, no duplication. `runGenerate` reads source/target via `ctx.adapters.fs` / `ctx.adapters.path`, builds candidate leaves (preserve / parity / `needsReview` / source-identical / missing — gated by `resume`), **delegates actual translation work to `runTranslate`**, applies the metadata pipeline, and writes the target file (unless `dryRun`). The CLI's `executeGenerate` becomes a thin shell: parse argv → build hooks (TTY prompts, progress bar, run events) → build `CoreContext` → call `runGenerate` per target → print summary.

---

## 4. Phases at a glance

| phase | scope | when | order constraint |
|---|---|---|---|
| **1 — Generate-first refactor** | Core owns generate orchestration. CLI calls `runGenerate`. | **Before policy work.** | Hard prerequisite for phase 2. |
| **2 — Translate policy** | All 10 steps from [`translate-policy.md`](./translate-policy.md), landing on the new substrate. | After phase 1. | Hard prerequisite for `fill` collapse. |
| **3 — Other ops architecture** | `runQuality`, `runReview`, `runMissing`, `runSync`, then the remaining CLI-owned ops listed in §7.2. Same pattern. (`runFill` is **not** part of this — `runGenerate({ resume: true })` covers it from 5.b.3.) | **Parallel with phase 2** (independent files). | Complete before the docs refactor. |
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

### 5.b — `runTranslate` primitive + `runGenerate` entry

Three sub-slices, each independently shippable. `runTranslate` is extracted *first* so SDK consumers gain the translate primitive even before `runGenerate` lands, and `runGenerate` is built on top of it (not on top of an internal helper).

| sub-slice | scope | parity gate |
|---|---|---|
| **5.b.1 ✓ identity guard** | move pure logic to `packages/core/src/translator/identity/`; CLI keeps thin host wrapper for the inquirer confirm UI | byte-identical |
| **5.b.2 ✓ `runTranslate` primitive** | extract the per-provider chain + retry/fallback + identity wiring + attempts/stats aggregation into a public SDK entry at `packages/core/src/translator/run.ts`. CLI stops owning the loop. Initial signature took a flat input object. | byte-identical |
| **5.b.2.refine `runTranslate(ctx, opts)`** | swap to `(ctx: TranslateContext, opts: TranslateOptions)` — bundle config/adapters/env into a context built via `createTranslateContext`. Pre-v1 reshape; CLI doesn't call `runTranslate` yet. | byte-identical |
| **5.b.3 `runGenerate` entry** | `packages/core/src/generate/run.ts` builds candidate leaves, calls `runTranslate` via `translateContextFromCore(ctx)`, applies metadata pipeline, returns `GenerateOutput`. Adds `resume?: boolean` from day one. CLI deletes `executeGenerate.ts`; `commands/generate/run.ts` becomes a thin shell that builds `CoreContext` and calls `runGenerate`. | byte-identical |
| **5.b.3.cli.split** | follow-up after `cli.collapse`: split the CLI shell into `commands/generate/{run,hooks,jsonEnvelope}.ts`. `run.ts` keeps argv merge + branching; `hooks.ts` owns `buildGenerateHostHooks`; `jsonEnvelope.ts` owns `emptyGeneratePayload`, `executeCore`, and `runGenerateJsonEnvelope` (matching the `commands/<cmd>/jsonEnvelope.ts` pattern across the CLI). | byte-identical |
| **5.b.3.config.zod-unify** | one `I18nPruneConfig` (zod-backed): the originals at `packages/core/src/config/schema/{define,root}.ts` directly return the public friendly type, and `config/index.ts` re-exports them as-is (no wrappers). The schema-derived shape stays internal as `I18nPruneConfigParsed` for `defaults/app.ts` + spread bodies. CLI `loadConfig` drops its `as I18nPruneConfig` cast. SDK consumers use `defineConfig` / `parseI18nPruneConfig` and pass the result straight into `createCoreContext`. | byte-identical |

**Adapter / env rule (binding for every sub-slice):** `adapters` and `env` are **required** fields on `TranslateContext` / `CoreContext`; core has no Node default and never touches `process.*`. The CLI imports `createNodeRuntimeAdapters` and passes both explicitly.

**New core files (across the four sub-slices):**
- `packages/core/src/translator/identity/` — done in 5.b.1.
- `packages/core/src/translator/run.ts` — `runTranslate` (5.b.2 + refined in 5.b.2.refine).
- `packages/core/src/translator/context.ts` — `TranslateContext`, `createTranslateContext` (5.b.2.refine).
- `packages/core/src/types/translator/translate.ts` — `TranslateOptions`, `TranslateOutput`, `ProviderAttemptReport`, etc. (5.b.2).
- `packages/core/src/generate/run.ts` — `runGenerate` (5.b.3).
- `packages/core/src/generate/context.ts` — `CoreContext`, `createCoreContext`, `translateContextFromCore` (5.b.3).
- `packages/core/src/types/generate/index.ts` — `GenerateOutput`, `GenerateOptions` (5.b.3).

**`runTranslate` signature (5.b.2):**
```ts
export type TranslateContext = {
  config: TranslateConfigInput;               // translate block only
  adapters: RuntimeAdapters;                  // required, no default
  env: Record<string, string | undefined>;    // required, no default
};

export function createTranslateContext(input: {
  config: TranslateConfigInput;
  adapters: RuntimeAdapters;
  env: Record<string, string | undefined>;
}): TranslateContext;

export type TranslateOptions = {
  /** Plain strings to translate; output preserves order. Use this OR `leaves`, not both. */
  texts?: readonly string[];
  /** Keyed leaves; output preserves order and surfaces `key` per result. */
  leaves?: readonly { key: string; source: string }[];

  targetLang: string;
  sourceLang?: string;

  pin?: { providerId?: TranslationProviderId; workers?: number };

  hooks?: {
    onTick?: TranslationTickProgressFn;
    onProviderAttempt?: (a: ProviderAttemptReport) => void;
    onTranslatedLeaf?: (sourceText: string, translatedText: string, key: string | number) => void | Promise<void>;
  };

  identityGuard?: { enabled?: boolean; threshold?: number };
};

export async function runTranslate(
  ctx: TranslateContext,
  opts: TranslateOptions,
): Promise<TranslateOutput>;

export type TranslateOutput = {
  /** Same length and order as `opts.texts` / `opts.leaves`. */
  translations: ReadonlyArray<TranslateResultItem>;
  providerAttempts: ProviderAttemptReport[];
  winnerProviderId: TranslationProviderId | null;
  fallbackCount: number;
  translateStats: TranslateRunPartialStats;
  issues: Issue[];
  warnings: Issue[];                          // from resolveTranslateConfig
};

export type TranslateResultItem =
  | { ok: true;  key?: string; value: string; providerId: TranslationProviderId; leafMeta?: TranslationLeafMeta }
  | { ok: false; key?: string; reason: 'identity' | 'failed' | 'skipped'; sourceValue: string };
```

**`runGenerate` signature (5.b.3):**
```ts
export type CoreContext = {
  config: I18nPruneConfig;
  adapters: RuntimeAdapters;                   // required, no default
  env: Record<string, string | undefined>;     // required, no default
  run?: RunOptions;                            // CLI run flags; optional for SDK
};

export function createCoreContext(input: {
  config: I18nPruneConfig;
  adapters: RuntimeAdapters;
  env: Record<string, string | undefined>;
  run?: RunOptions;
}): CoreContext;

/** Project ops needing the translator project a CoreContext to a TranslateContext via this helper. */
export function translateContextFromCore(ctx: CoreContext): TranslateContext;

export type GenerateOptions = {
  target: string;                              // single target per call

  metadata?: boolean;
  dryRun?: boolean;
  force?: boolean;

  /**
   * When true, only re-translate leaves that are `needsReview: true` (when metadata on),
   * source-identical, or missing. Replaces today's `fill` command in phase 4.
   */
  resume?: boolean;

  pin?: { providerId?: TranslationProviderId; workers?: number };

  hooks?: {
    onTick?: TranslationTickProgressFn;
    onProviderAttempt?: (a: ProviderAttemptReport) => void;
    onIncomplete?: (i: IncompleteRunInfo) => Promise<IncompleteRunDecision>;
    onHandoffPick?: (offer: HandoffOffer) => Promise<TranslationProviderId | null>;
    onTranslatedLeaf?: (sourceText: string, translatedText: string, path: string) => void | Promise<void>;
  };

  identityGuard?: { enabled?: boolean; threshold?: number };
};

export async function runGenerate(
  ctx: CoreContext,
  opts: GenerateOptions,
): Promise<GenerateOutput>;
```

`RuntimeAdapters` is the published type (`@i18nprune/core/runtime/{node,web,edge}`); this doc previously called it `HostAdapters` — name aligned to the published surface.

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

**What moves into `runTranslate` (5.b.2):**
- The per-provider `for` loop currently in `executeGenerate` (lines ~223-368).
- `TranslateRunInterruptedError` partial-resume handling at the *translate* layer.
- Identity-streak guard wiring (uses 5.b.1 core guard; host supplies confirm callback via hooks).
- Provider-attempts aggregation.
- Translate-stats aggregation.
- Per-provider rate-limit profile + workers-effective math (currently in CLI's `resolveCliTranslateMaxParallelEffective` etc. — already covered by `resolveTranslateConfig`; CLI shims get deleted in 5.b.2 alongside).

**What moves into `runGenerate` (5.b.3):**
- Source-leaf collection from raw locale JSON (`collectStringLeaves`).
- Existing-target read + candidate-leaf builder (preserve / parity / source-identical / `needsReview` / missing — gated by `resume`).
- Metadata pipeline application (`applyLocaleLeafNormalization`).
- Locale-file write (target + meta sidecar) via `adapters.fs` (5.c finishes the IO migration).
- `GenerateOutput` shape construction.

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
- `packages/core/src/types/runtime/adapters.ts` (already exports `RuntimeAdapters`; verify SDK surface coverage).

**What moves:**
- `readHostJsonUnknown(sourcePath, ctx.adapters.fs)` → core, called via `runGenerate`.
- Existing target read.
- Target write + meta sidecar write.

**What stays in CLI:**
- `resolveFromCwd` for argv-relative paths (CLI converts to absolute before calling `runGenerate`).
- `existsRuntimeFsSync` for sidecar checks (CLI still wants to know whether to prompt).

**Parity rule:** identical files written, identical file-not-found behavior, identical "skipped target already complete" log.

---

### 5.d — Canonical op pattern (the "generate playbook" for other ops)

This subsection codifies the layout that **emerged from 5.b.1 → 5.b.3.config.zod-unify**. Every later op migration (§ 7 / Phase 3) and every future feature that wants to live in core should follow these rules unless the op has a documented reason to diverge. **If you fork the pattern, write it down here in the same PR**.

#### 5.d.1 Core file layout (`packages/core/src/<op>/`)

| file | responsibility | exported via |
|---|---|---|
| `run.ts` | Single L3 entry function `runXxx(ctx, opts, host, hooks?)`. Owns orchestration, delegates pure computation to siblings, uses `ctx.adapters.*` for IO, emits operation copy through `run.message`, and calls host decision/progress hooks where needed. Returns `{ payload, issues }` for the op's JSON shape. | `index.ts` + root barrel |
| `context.ts` | `createXxxContext(input)` builder + (optional) `xxxContextFromCore(ctx)` projection. Bundles `config + adapters + env + paths + run?`. No work; pure data assembly. | `index.ts` |
| `<op>-specific helpers` (e.g. `normalize.ts`, `targetScope.ts`) | Pure functions used by `run.ts`. No `console.*`, no `process.*`, no IO. Testable in isolation, exported for SDK consumers who want the building blocks without the full op. | `index.ts` |
| `errors/<name>.ts` (when needed) | Error classes carrying machine-readable state for the op (e.g. `TranslateRunInterruptedError` with `partialStats`). One class per file; flat `errors/index.ts` barrel. | `index.ts` re-exports the `errors/index.js` barrel |
| `index.ts` | Barrel only. Re-exports types from `../types/<op>/index.js` plus the op's runtime functions. **No logic.** | root `packages/core/src/index.ts` |

**Type layout (`packages/core/src/types/<op>/`):**

| file | responsibility |
|---|---|
| `<opRun>.ts` | The op's L2 contract: `XxxContext`, `XxxRunOptions`, `XxxOutput` / `XxxJsonPayload`, `XxxHostHooks` (host capabilities the op requires). |
| `hooks.ts` | Mid-run **decision** hooks (`XxxRunHooks`): `onIncomplete`, `onHandoffPick`, etc. **Optional 4th argument** to `runXxx`. Decision-input + decision-output types live here too (flat — one type per concept). |
| `index.ts` | Barrel for the two files above. |

#### 5.d.2 Naming + signature conventions

- **Entry function**: `runXxx(ctx: XxxContext, opts: XxxRunOptions, host: XxxHostHooks, hooks?: XxxRunHooks)`. Always async. Always returns `Promise<{ payload, issues }>` with the op's JSON-shaped payload.
- **Translate-using ops** take `CoreContext` and project to `TranslateContext` via `translateContextFromCore(ctx)` when calling `runTranslate`. Translate-only ops take `TranslateContext` directly.
- **Hooks vs host**: `XxxHostHooks` is **required** (the host always implements it; printers / progress / identity / interactive policy live here). `XxxRunHooks` is **optional** (only present when there are mid-run decisions to delegate; omitting it keeps today's defaults).
- **One file per error class** under `errors/`. Errors carry typed state (no string sniffing).
- **No `runXxxCommand`, no `runXxxOperation`**. Just `runXxx`. CLI wrappers don't get their own `runXxx` name in core.

#### 5.d.3 CLI host layout (`packages/cli/src/commands/<op>/`)

For ops that need orchestration in core, the CLI is a **thin host** with three files:

| file | responsibility |
|---|---|
| `run.ts` | Command entry exported as `xxx(opts)`. Argv merge from env, `resolveContext`, branch on `--json` vs human, post-success patching / cache refresh. ~120 lines. **Never builds host hooks itself; never owns envelope shaping.** |
| `hooks.ts` | `buildXxxHostHooks(ctx, runtime)` returning the CLI flavor of `XxxHostHooks` (TTY prompts, identity guard, progress relay). Message rendering comes from the shared CLI `RunEmitter`. |
| `jsonEnvelope.ts` | `emptyXxxPayload(ctx, opts)`, `executeCore(ctx, merged, runtime)` (single call site for core's `runXxx`; reused by both `--json` and human paths), and `runXxxJsonEnvelope(ctx, merged, runtime)` (success / failure envelope shaping + `run.*` event emission; **never throws**). |
| `prompts.ts` (when needed) | Inquirer / TTY prompts. Pure host concern. |
| `summary/*.ts` (when needed) | Human-mode printers (banner, finalize summary, parity report). |
| `env.ts` (when needed) | `mergeXxxOptionsFromEnv(opts)` — argv ⊕ `process.env` overlay. |
| `index.ts` | Barrel: re-export `xxx` from `./run.js` and the public `XxxOptions` type. |

**`commands/<op>/run.ts` is forbidden from**:
- Calling core's `runXxx` directly (always go through `executeCore` in `jsonEnvelope.ts`).
- Defining `XxxHostHooks` inline (always come from `hooks.ts`).
- Building the JSON envelope (always come from `jsonEnvelope.ts`).
- Reading from disk before calling `executeCore` (the op owns IO via adapters; CLI only resolves argv-relative paths).

#### 5.d.4 Logging + policy split

- **Core owns operation message copy.** Core emits info/detail/notice/warn strings as `run.message`; it does not call `console.*` and does not apply CLI visibility policy.
- **Host owns rendering policy.** CLI's `RunEmitter` renderer maps `run.message` to `logger.info` / `logger.detail` / `logger.notice` / `logger.warn`; SDK consumers can show, collect, ignore, or map messages into their own UI.
- **Prompts stay host-owned.** Core may emit “about to write” / “skipped” / “summary” messages, but the host still owns the interactive question and decision.

#### 5.d.5 Run events (`run.*` emission)

- **Emission is host-wired**, accessed by core via `host.emit` / `host.emitProgress` / the runtime helpers (`emitRunEvent`, `emitRunMessage`, `emitRunErrorFromUnknown`, `emitIssuesAsRunErrors`, `nowMs`).
- The **JSON envelope wrapper** (`runXxxJsonEnvelope`) emits `run.started` / `run.completed` / `run.summary` / `run.failed`.
- The **core `runXxx`** emits `run.progress.<op>` events at the canonical phases (`scan_*`, `read_source`, `resolve_targets`, `build_target`, `merge`, `prune`, `write_files`, `done` — pick the subset relevant to the op) and `run.message` for user-facing operation copy.
- `noopRunEmitter` is the CLI default when no out-of-band consumer is attached. SDK consumers can pass their own `RunEmitter` to surface progress over IPC / WebSocket / etc.

#### 5.d.6 Error + issue conventions

- **Throw `I18nPruneError`** for fatal usage / config errors. Carry a `'USAGE' | 'IO' | 'TRANSLATE'` code. CLI maps `USAGE` → `ISSUE_<OP>_USAGE` issue + `process.exitCode = 1`.
- **Throw a typed error class** (under `errors/`) when the failure carries structured state the host needs to act on (e.g. `TranslateRunInterruptedError.translateStats`).
- **Return `issues[]`** for non-fatal warnings / informational rows. Issue codes are stable API — never rename existing codes.
- **Decision hooks return `Decision` objects**, not raw values. `IncompleteRunDecision = { action: 'abort_no_write' | 'write_partial' | 'retry_provider' }` is the template — extend with a discriminated union when more actions land.

#### 5.d.7 SDK example contract (per op)

Each op ships with `examples/sdk/<op>/<run<Op>>.ts` in the **same PR** as the op's core migration (per [`examples/README.md`](../../examples/README.md)). Required structure:

1. Build `RuntimeAdapters` (explicit; never auto-default).
2. Author config in `i18nprune.config.ts` via `defineConfig` (or load via `loadCoreConfigFromPath`); pass directly into the L2 builder — no cast.
3. Build the L2 context for the op.
4. Implement a **headless** `XxxHostHooks` (no TTY, no `console`, `run.message` → stderr if messages are displayed).
5. (Optional) Implement `XxxRunHooks` showing the most useful policy choice.
6. Call `runXxx(ctx, opts, host, hooks?)` with `dryRun: true` by default.
7. Inspect returned `payload` + `issues`.

Examples must compile under the root `tsconfig.json` (the `examples/**/*.ts` glob is included) and run via `pnpm tsx examples/sdk/<op>/<file>.ts` from repo root — no API keys for the public path.

#### 5.d.8 Parity gates per op migration

Every op migration PR runs:

1. `pnpm typecheck` — clean.
2. `pnpm test` — green.
3. `pnpm vitest run tests/parity` — byte-identical for any op already covered there.
4. **New**: add a parity snapshot under `tests/parity/<op>.parity.test.ts` capturing `--json` envelope + stripped human stderr for the op's canonical fixture run. The snapshot becomes the merge gate for subsequent slices on that op.

#### 5.d.9 Forbidden patterns (carried forward)

These rules are absolute (already in § 10, restated for the playbook):

- No `console.*` in `packages/core/src/**`.
- No `process.*` in core except via the passed-in `env` parameter.
- No file IO in core except via passed-in `RuntimeAdapters`.
- No default-resolving runtime adapters in core.
- No CLI re-export shim files for core types.
- No new `runXxxCommand` / `runXxxOperation` names — one entry, one name: `runXxx`.

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
| 7 (handoff) | core: `packages/core/src/translator/policy/handoff.ts` (eligibility + offer); CLI: `packages/cli/src/shared/translator/handoff.ts` (TTY picker UI) |
| 8 (JSON envelope) | already in CLI summary, sources data from `GenerateOutput` |
| 9 (docs + tests) | unchanged |
| 10 (partial-run hook) | core: hook in `runGenerate`; CLI: prompt impl |

**`translate-policy.md` will be edited surgically** to reflect these locations once this doc lands. No scope change.

---

## 7. Phase 3 — Other ops architecture (parallel with phase 2)

Same playbook as § 5.d. Each migration is one slice per PR with its own parity snapshot.

| op | uses translate-policy? | existing CLI executor | core entry | rough size |
|---|---|---|---|---|
| `sync` | no — pure JSON merge / metadata | `commands/sync/run.ts` + `commands/sync/jsonEnvelope.ts` (`runSync` already in CLI) | `core/src/sync/run.ts` | medium |
| `missing` | no — locale ↔ source diff | `commands/missing/run.ts` | `core/src/missing/run.ts` | small |
| `quality` | no — source-identical leaf count (parity-adjacent) | `commands/quality/run.ts` + `commands/quality/jsonEnvelope.ts` | `core/src/quality/run.ts` (`runQuality`; CLI wrapper `runQualityJsonEnvelope`) | small — landed |
| `review` | no — needs-review row aggregation | `commands/review/run.ts` + `commands/review/jsonEnvelope.ts` | `core/src/review/run.ts` (`runReview`; CLI wrapper `runReviewJsonEnvelope`) | small — landed |

**`fill` is intentionally absent** — its substrate (`runGenerate({ resume: true })`) landed in 5.b.3, so phase 3 has nothing to migrate. Phase 4 just deletes the CLI command surface.

### 7.2 — Remaining core-op migrations before docs refactor

After the cache-owned analysis slice, these commands are the remaining CLI-owned orchestration surfaces that should become core ops **before** the docs refactor starts. Keep one command per slice and preserve parity snapshots.

| order | command | target core entry | notes |
|---|---|---|---|
| 1 | `validate` | `core/src/validate/run.ts` (`runValidate`) | Move the current command-local JSON envelope orchestration into core so validate owns the same cached analysis resolver as sync/missing/quality/review. CLI remains argv/rendering only. |
| 2 | `report` | `core/src/report/run.ts` (`runReport`) | Move project-report document building into core; CLI keeps output format selection (HTML/JSON/CSV/text), file naming, and write/prompt behavior. |
| 3 | `doctor` | `core/src/doctor/run.ts` (`runDoctor`) | Core owns findings and issue payloads; CLI keeps terminal rendering and any host-specific executable checks that require adapters/capabilities. |
| 4 | `locales dynamic` | `core/src/locales/dynamic/run.ts` (or `core/src/locales/runDynamic.ts`) | Should become a thin view over core project analysis + list-window shaping; this removes the last command-specific dynamic-scan cache path. |
| 5 | `locales list`, `locales edit`, `locales delete` | `core/src/locales/*/run.ts` entries | Lower risk after dynamic/report/doctor. Core owns locale file discovery and metadata edits via adapters; CLI keeps prompts, confirmations, and banners. |

Docs refactor should start only after these remaining op boundaries are settled, otherwise user docs will mirror temporary CLI-owned seams.

### 7.3 — `quality` / `review` and translate-policy: independent

Neither op talks to translation providers, runs the per-leaf retry chain, or consults provider health. Their core code (`packages/core/src/quality/`, `packages/core/src/review/`) is already pure — only the CLI orchestration (resolve context → call helpers → shape envelope) hasn't been collapsed into a `runXxx` entry yet.

This means:

- **They do NOT need to migrate before translate-policy.** Translate-policy lands inside `runGenerate` (and later `runTranslate` policy resolver); no review / quality code path is on that hot path.
- **They will NOT benefit from translate-policy** when they do migrate. They'd inherit the playbook (§ 5.d) but would have empty `XxxRunHooks` (no mid-run decisions to make).
- **Recommended order**: ship translate-policy (phase 2) on the `generate` substrate first; then start phase 3 with `sync` (medium-size dry run for the playbook on a non-translation op), then small ops (`missing`, `quality`, `review`) in any order.

`sync` is the recommended next phase-3 candidate because it exercises the playbook against a real IO-heavy op without dragging translate-policy along. `quality` and `review` are mechanical conversions afterward.

---

## 8. Phase 4 — Delete `fill`, thin CLI executors

After phases 1–3 stable. `runGenerate({ resume: true })` is in core since 5.b.3 (phase 1), so this phase is mostly **CLI surface deletion**.

### 8.a — Delete `fill` command (pre-v1, no deprecation alias)

Remove:
- `packages/cli/src/commands/fill/` (entire folder).
- `packages/cli/bin/cli.ts` `fill` registration.
- Public docs: `docs/commands/fill/` (delete) + add a short pointer in `docs/commands/generate/` explaining `--resume` is the replacement.
- All references in user docs / landing copy.

Keep:
- The `--resume` flag on `generate` (already wired in 5.b.3).
- Core `runGenerate({ resume: true })` (already canonical).

No `runFill` shim. No deprecation alias. Pre-v1.

### 8.b — Thin CLI executors

After 5.b.3 the CLI's `commands/generate/` is split into three files:

- `run.ts` — argv merge, `resolveContext`, branch on `--json` vs human, post-success patching/cache. ~120 lines.
- `hooks.ts` — `buildGenerateHostHooks(ctx, runtime)` returning the `GenerateHostHooks` for the CLI flavor (TTY prompts, identity guard, progress relay).
- `jsonEnvelope.ts` — `emptyGeneratePayload`, `executeCore` (single call site for core `runGenerate`; reused by both `--json` and human paths), and `runGenerateJsonEnvelope` (wraps `executeCore` with success/failure envelope shaping + `run.*` event emission). Same layout as `commands/<cmd>/jsonEnvelope.ts` for sync/missing/cleanup/quality/review/etc.

For reference, the sketch of `executeCore`:
```ts
export async function runGenerateCommand(cliCtx: CliContext, merged: GenerateOptions, runtime?: { emit?: RunEmitter; runId?: string }) {
  const ctx = createCoreContext({
    config: cliCtx.config,
    adapters: cliCtx.adapters,
    env: process.env,
    run: cliCtx.run,
  });
  const { warnings } = resolveTranslateConfig({ config: ctx.config.translate, env: ctx.env, pin: { providerId: merged.provider, workers: merged.workers } });
  warnings.forEach((w) => logger.warn(w.message, ctx.run));

  const targets = resolveTargets(merged, ctx);  // argv → string[]
  const results: GenerateTargetJsonRow[] = [];

  for (const target of targets) {
    const session = createSessionProgress({ ... });
    const out = await runGenerate(ctx, {
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

`commands/generate/execute.ts`, `commands/generate/runGenerate.ts`, and `commands/generate/hostBridge.ts` were deleted in 5.b.3.cli.collapse. `run.ts` was further split in 5.b.3.cli.split into `run.ts` + `hooks.ts` + `jsonEnvelope.ts`; the CLI directory now holds `run.ts`, `hooks.ts`, `jsonEnvelope.ts`, `prompts.ts`, `summary/`, `env.ts`, and `index.ts`. The CLI is still needed for argv, prompts, banners, env, and TTY-only side effects — but `runGenerate` itself lives in core, and **the CLI is one host of many**: SDK / extension / web / worker consumers call core `runGenerate` directly with their own `GenerateHostHooks` (see `examples/sdk/generate/runGenerate.ts`).

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
- `process.*` access in core (must come through passed-in `env` parameter).
- File IO in core except via passed-in `RuntimeAdapters` (`adapters.fs` / `adapters.path`).
- Default-resolving runtime adapters in core (no `kind === 'node'` sniffing, no `createNodeRuntimeAdapters()` fallback). Adapters are always supplied by the host.

---

## 11. SDK consumer surface after each phase

After **5.b.2 (phase 1, mid)**: SDK gets the translate primitive with `(ctx, opts)` shape.
```ts
const ctx = createTranslateContext({
  config: { primary: 'google', providers: [{ id: 'google', enabled: true }] },
  adapters,           // required
  env,                // required
});
const out = await runTranslate(ctx, { texts: ['Welcome', 'Sign in'], targetLang: 'fr' });
```

After **5.b.3 (phase 1, end)**: SDK gets `runGenerate(ctx, opts, host, hooks?)` with `resume` from day one. The CLI's host wiring lives in `packages/cli/src/commands/generate/{run,hooks,jsonEnvelope}.ts`; SDK / extension / web / worker consumers ship their own `GenerateHostHooks` and reach the same engine through `examples/sdk/generate/runGenerate.ts`.

```ts
const config = defineConfig({ /* …authored once, returns the public `I18nPruneConfig` directly… */ });
const ctx = createCoreContext({ config, adapters, env, paths });
const headlessHost: GenerateHostHooks = { /* no-TTY printers, headless prompts, run.message -> stderr */ };
const out    = await runGenerate(ctx, { targets: ['fr'], metadata: true }, headlessHost);
const filled = await runGenerate(ctx, { targets: ['fr'], resume: true, metadata: true }, headlessHost);
```
No translate-policy yet — single provider per call (config-driven), one shot. Identity guard runs. Mid-run decisions are exposed through optional `GenerateRunHooks` (`onIncomplete`, `onHandoffPick`).

After **phase 2**: Same calls, now with full policy / chain / handoff / partial-run hook.

After **phase 3**: Same pattern for `runQuality`, `runReview`, `runMissing`, `runSync`. `runFill` is **never added** — it doesn't need to exist.

After **phase 4**: `fill` command is deleted from the CLI; `runGenerate(ctx, { resume: true })` is the only API.

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

- **Adapter exposure — DECIDED.** `RuntimeAdapters` is the SDK surface (published via `@i18nprune/core/runtime/{node,web,edge}`). `runGenerate` and `runTranslate` take it as a **required** field on their respective context. **No defaults, no Node auto-pick.** Hosts always supply both `adapters` and `env`. This doc previously used the older name `HostAdapters` — those are now `RuntimeAdapters`.
- **`runTranslate` primitive — DECIDED.** Translate-only SDK entry at `packages/core/src/translator/run.ts` (signature `(ctx: TranslateContext, opts: TranslateOptions)`), lands in 5.b.2. `runGenerate` is built on top of it via `translateContextFromCore(coreCtx)`; SDK consumers can also use it directly without `I18nPruneConfig` or any locale-shape concerns.
- **`generate --resume` substitute for `fill` — DECIDED.** `runGenerate` exposes `resume?: boolean` from 5.b.3 onward. No `runFill` ever ships in core. Phase 4 deletes the CLI `fill` command outright (pre-v1; no deprecation alias).
- **L2 context builders — DECIDED.** Two pure host-context bundlers, both living in core:
  - `createTranslateContext({ config: TranslateConfigInput, adapters, env })` → `TranslateContext` (translate primitive only). Lands in 5.b.2.refine.
  - `createCoreContext({ config: I18nPruneConfig, adapters, env, run? })` → `CoreContext` (project ops). Lands in 5.b.3.
  - `translateContextFromCore(coreCtx)` projects the latter to the former so `runGenerate` reuses `runTranslate` without duplication.
  - All `runXxx` entries take `(ctx, opts)` — single bundled context, never separate `config / adapters / env` parameters at the call site.
  - Both `adapters` and `env` are required on both contexts. The CLI's existing `resolveContext` becomes a thin wrapper that adds CLI-only fields (`meta.fieldSources`, `meta.warnings`, `meta.cache`) on top of `CoreContext`.
- **Run events as the canonical observability surface** (was Slice G in the prior proposal). Folded into phase 4 cleanup, not a separate slice.
- **Non-Node runtime presets.** `web` and `edge` are already wired in `packages/core/src/runtime/factory/`; phase 1 does not need to expand them, but both `runTranslate` and `runGenerate` are shape-compatible with all three.
