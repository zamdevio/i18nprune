# Translation config (`generate` / `generate --resume`)

Use **`translate`** in **`i18nprune.config.*`** as a **roster** of backends (**`translate.providers`**) plus a **default id** (**`translate.primary`**) when the CLI flag and provider env omit.

**Discover backends:** run **`i18nprune providers`** (or **`--json`**) for ids, env var names, and minimal **`translate.{ primary, providers }`** examples from **`@i18nprune/core`**.

## Canonical shape

| Field | Meaning |
|-------|--------|
| **`primary`** | Default **`TranslationProviderId`** when **`--provider`** and **`I18NPRUNE_TRANSLATE_PROVIDER`** are unset (must match an **enabled** row in **`providers`**). |
| **`providers`** | Non-empty array; each element is **`{ id: '…', … }`** (discriminated union). **`enabled: false`** ignores a row for merges (rich **`init`** leaves optional backends scaffolded off). **`rateLimit`** — optional **`maxConcurrency`**, **`rpm`**, **`rps`**, **`intervalMs`**. Duplicate **`id`** values are rejected. |
| **`policy`** | Optional **translate-policy** block (`maintainer/phases/translate-policy.md`). Parse merges **`TRANSLATE_POLICY_DEFAULTS`**; **`maxAttempts`** defaults to **`providers.length`**. Keys: **`routing`**, **`onRateLimit`**, **`onTransientFailure`**, **`onQuotaExceeded`**, **`onAuthFailure`**, **`onProviderUnavailable`**, **`onIdentityOutput`**, **`onIncompleteRun`**, **`maxAttempts`**, **`handoff`**. **`.strict()`** rejects unknown keys. |
| **`workers`** | **`number`** (**`1…64`**): max parallel **`translateLeaf`** jobs when CLI/env omit **`--workers`** (**`1`** = serial; default when omitted). |

### Row fields by **`id`**

| **`id`** | Extra fields |
|----------|----------------|
| **`google`** | optional **`enabled`**, **`rateLimit`** |
| **`mymemory`** | optional **`contactEmail`**, **`enabled`**, **`rateLimit`** |
| **`libre`** | optional **`baseUrl`**, **`enabled`**, **`rateLimit`** |
| **`deepl`** | optional **`apiKey`**, **`enabled`**, **`rateLimit`** |
| **`llm`** | optional **`apiKey`**, **`baseUrl`**, **`model`**, **`enabled`**, **`rateLimit`** |

**Example:**

```typescript
export default defineConfig({
  source: 'locales/en.json',
  localesDir: 'locales',
  src: 'src',
  functions: ['t'],
  translate: {
    primary: 'llm',
    providers: [
      { id: 'google' },
      {
        id: 'llm',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
        // apiKey: prefer env — I18NPRUNE_TRANSLATE_LLM_API_KEY
      },
    ],
    policy: { routing: 'single', onRateLimit: 'backoff', onTransientFailure: 'retry' },
  },
});
```

Run **`i18nprune init --rich`** for every namespace, including **`translate.providers`** stubs and **`policy`**.

## `translate.policy` (outcome → verb)

Orchestration is **forward-only**: each failure class maps to a policy key whose value is a single **verb** (`retry`, `backoff`, `fallback`, `prompt`, `abort`, `flag`). Defaults match the locked table in **`maintainer/phases/translate-policy.md`** §6. Verb meanings §4.

| Key | Default | Allowed verbs |
|-----|---------|----------------|
| **`routing`** | `single` | `single` \| `auto` |
| **`onRateLimit`** | `backoff` | `backoff` \| `retry` \| `fallback` \| `abort` |
| **`onTransientFailure`** | `retry` | `retry` \| `fallback` \| `abort` |
| **`onQuotaExceeded`** | `fallback` | `fallback` \| `prompt` \| `abort` |
| **`onAuthFailure`** | `abort` | `abort` \| `prompt` |
| **`onProviderUnavailable`** | `fallback` | `fallback` \| `abort` |
| **`onIdentityOutput`** | `flag` | `flag` \| `fallback` \| `abort` |
| **`onIncompleteRun`** | `confirm` | `confirm` \| `write` \| `discard` |
| **`maxAttempts`** | `providers.length` | positive integer |
| **`handoff`** | `auto` | `auto` \| `on` \| `off` |

**`providers[]` order is the auto chain** when **`routing: 'auto'`** — see init template comments.

### Mid-run handoff (catalog pool)

When policy resolves to **`prompt`** and the host is interactive (**`handoff`** matrix §8 in the plan doc), **`runGenerate`** offers the **built-in** provider catalogue (**not** the same as reordering `providers[]` only): **`google`**, **`mymemory`**, **`libre`**, **`deepl`**, **`llm`**, excluding the failing id. **`deepl`** appears only if **`apiKey`** resolves (**`I18NPRUNE_TRANSLATE_DEEPL_API_KEY`** or the **`deepl`** row). **`llm`** requires **`apiKey`**, **`baseUrl`**, and **`model`**. **`libre`** without a URL can use the public demo origin when picked from the handoff list.

### `--json` route detail

Each finished target includes **`markedForReview`** (already present) and **`providerAttempts[]`** rows: legacy **`outcome`** (`success` / `rate_limited` / `network_error` / `non_retryable_error`) plus, on failures, **`translateFailureOutcome`** — the seven-variant classifier string (`rate_limited`, `quota_exceeded`, `transient_network`, …) for tooling and dashboards.

When at least one target was finalized as a **partial** write (see **`onIncompleteRun`** below), the payload also includes **`partial: true`**, **`resumeHint: "generate --resume"`**, and **`markedForReview`** (sum across those targets). Each such row sets **`partial: true`** on **`targetResults[]`**.

Order (first wins):

1. **`--provider`** (`generate`, including **`generate --resume`**)
2. **`I18NPRUNE_TRANSLATE_PROVIDER`**
3. **`translate.primary`**
4. Built-in default (**`google`**)

Credential fields merge only from the **`translate.providers`** row whose **`id`** matches the resolved backend. Rows with **`enabled: false`** are skipped.

When **`policy.routing` is `'auto'`**, the CLI resolves an ordered chain: the pin (**`--provider`** / env) or **`translate.primary`** first, then every other **enabled** provider row (deduped, typically config file order). After **retryable** failures (**`429`**, transient network errors, etc.), the next provider continues **`generate`** (full or **`--resume`**) using the **same in-memory locale**: paths already translated by the previous backend are **not** sent again; only remaining strings hit the next provider. **`routing: 'single'`** locks to **one** id for that run (no chain).

### Routing combinations (mental model)

Treat **`routing`** and **`--provider` / env** as:

| Config routing | CLI / env provider pin | Effective chain (example providers **`google`**, **`mymemory`**) |
|----------------|------------------------|-------------------------------------------------------------------|
| **`single`** | (none) | **`[`translate.primary`]`** only |
| **`single`** | `--provider mymemory` | **`['mymemory']`** only (config primary ignored for ordering) |
| **`auto`** | (none) | **`[`primary`, …other enabled rows in file order]`** |
| **`auto`** | `--provider mymemory` | **`['mymemory', …other enabled rows]`** (`mymemory` first, then fallbacks) |
| **`auto`** | env **`I18NPRUNE_TRANSLATE_PROVIDER=mymemory`** | Same as row above |

Retryable failure ⇒ advance one step in the chain and continue **without discarding** successful leaf translations from earlier attempts.

Skipped rows: **`enabled: false`** never appears in the chain. Rows missing required secrets (**DeepL `apiKey`**, **`libre` `baseUrl`**, **`llm`** triple) fail **`assertTranslationProviderCredentialsReady`** when that id’s turn arrives — the run stops with a **`USAGE`** error (see below); they are **not** silently skipped.

### Partial runs (`onIncompleteRun`)

When **`generate`** cannot finish every string leaf for a target (chain exhausted, non-retryable error, or interrupt), core applies **`translate.policy.onIncompleteRun`**:

| Verb | Behavior |
|------|----------|
| **`discard`** | Throw the last error; no locale file is written for that target. |
| **`write`** | Finalize in-memory JSON (same normalization path as a full success) and write (**`--dry-run`** still exercises the path without touching disk). |
| **`confirm`** | Interactive CLI: prompt to write or abort. **`--yes`**, non-interactive runs, and **`--json`** map to **`write`** (loss of completed translations is worse than auto-writing a partial file). SDK / **`runGenerate`** without **`GenerateRunHooks.onIncomplete`**: **`confirm`** defaults to **`write`** in core. |

### Missing **`apiKey`** / **`baseUrl`** / **`model`**

Before each provider attempt, the CLI validates required fields (after env merge). If anything required is missing, it throws **`I18nPruneError`** with **`code: 'USAGE'`** and **`issueCode: i18nprune.translate.missing_credentials`** — **immediate hard stop** (no translation). In **`--json`** mode, **`generate`** maps that to an **`issues[]`** row via **`usageIssueFromI18nPruneError`** (same pattern as other usage failures). Human runs log the error message on stderr; there is no separate warning-only path for misconfigured backends.

### Example commands (copy/paste)

Assume **`locales/en.json`**, **`locales/`**, and **`src/`** match your project.

**A — Auto fallback (MyMemory first, Google second), config-driven**

```bash
# policy.routing: 'auto', translate.primary: 'mymemory', providers include google + mymemory (both enabled)
i18nprune generate --target ja --metadata --workers 8 --yes
```

**B — Same roster, but force Google first for this run**

```bash
i18nprune generate --target ja --metadata --provider google --workers 8 --yes
```

**C — Single routing: only primary, no fallback even if many providers exist**

```bash
# policy.routing: 'single'
i18nprune generate --resume --target de --metadata --workers 4 --yes
```

**D — Resume all targets with env pin + auto chain**

```bash
export I18NPRUNE_TRANSLATE_PROVIDER=mymemory
i18nprune generate --resume --all --metadata --yes
```

## Precedence — same field again (env vs file)

If a matching **`I18NPRUNE_TRANSLATE_*`** env var is non-empty, it **supersedes** the same field on the active row. Tables: **[Environment variables](./env.md)** (translation backends).

## Parallel translation (`--workers`)

| Source (CLI wins first) | Meaning |
|-------------------------|--------|
| **`--workers <n>`** | Hard override (clamped **1…64**). |
| **`I18NPRUNE_TRANSLATE_MAX_WORKERS`** | Env baseline when flag omitted. |
| **`translate.workers`** | Config baseline (integer **`≥ 1`**) when env + flag omit. |

With **`--workers` > 1**, core uses a bounded parallel translate pool then ordered replay (same final locale JSON as **`--workers 1`**). Details: **[Translation progress](../progress/README.md)**.

### Providers with strict quotas (429)

Free tiers (**`mymemory`**, etc.) return **`429`** quickly. i18nprune enforces provider **`rateLimit`** pacing using **`rpm`**, **`rps`**, and **`intervalMs`**. If quotas still trip, reduce **`--workers`**, lower **`rpm`** / **`rps`**, widen spacing, retry, or change **`--provider`**.

When no throttle fields are provided, i18nprune applies conservative per-provider defaults (including `maxConcurrency`) and may warn when a requested `--workers` value is reduced to a safer effective cap.

When MyMemory returns quota text (e.g. *NEXT AVAILABLE IN ...*), i18nprune parses that wait window and includes it in failure messaging / issue payloads so operators can retry at a concrete time.

## Source of truth

- Zod: **`packages/cli/src/config/schema.ts`** — **`translate.workers`** must be a bare **integer** **`1…64`** (or omit for **`1`**). Objects / **`concurrency`** keys are **not** accepted.
- Merge: **`resolveTranslationProviderOptions`** (**`packages/cli/src/shared/translator/resolveProvider.ts`**).
- Concurrency: **`resolveTranslateMaxParallel`** (**`@i18nprune/core`**) · **`resolveCliTranslateMaxParallel`**.
- Troubleshooting: **[Issues — translate](../issues/translate.md)**.
