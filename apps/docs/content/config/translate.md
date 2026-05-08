# Translation config (`generate` / `fill`)

Use **`translate`** in **`i18nprune.config.*`** as a **roster** of backends (**`translate.providers`**) plus a **default id** (**`translate.primary`**) when the CLI flag and provider env omit.

**Discover backends:** run **`i18nprune providers`** (or **`--json`**) for ids, env var names, and minimal **`translate.{ primary, providers }`** examples from **`@i18nprune/core`**.

## Canonical shape

| Field | Meaning |
|-------|--------|
| **`primary`** | Default **`TranslationProviderId`** when **`--provider`** and **`I18NPRUNE_TRANSLATE_PROVIDER`** are unset (must match an **enabled** row in **`providers`**). |
| **`providers`** | Non-empty array; each element is **`{ id: '…', … }`** (discriminated union). **`enabled: false`** ignores a row for merges (rich **`init`** leaves optional backends scaffolded off). **`rateLimit`** — optional **`maxConcurrency`**, **`maxRequestsPerMinute`**, **`minIntervalMs`** (honoured once orchestration lands; safe to author today). Duplicate **`id`** values are rejected. |
| **`policy`** | Optional orchestration presets; parse supplies defaults (**`routing: 'single'`**, backoff / retry enums). **`routing: 'auto'`** is parsed but **not implemented** yet — use **`single`**. **`policy.throttle`** supplies project-wide throttle defaults merged under rows that omit **`rateLimit`**. |
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
    policy: { routing: 'single', onRateLimitResponse: 'backoff', onTransientFailure: 'retry' },
  },
});
```

Run **`i18nprune init --rich`** for every namespace, including **`translate.providers`** stubs and **`policy`**.

## Precedence — which **`id`** runs?

Order (first wins):

1. **`--provider`** (`generate`, `fill`)
2. **`I18NPRUNE_TRANSLATE_PROVIDER`**
3. **`translate.primary`**
4. Built-in default (**`google`**)

Credential fields merge only from the **`translate.providers`** row whose **`id`** matches the resolved backend. Rows with **`enabled: false`** are skipped.

## Precedence — same field again (env vs file)

If a matching **`I18NPRUNE_TRANSLATE_*`** env var is non-empty, it **supersedes** the same field on the active row. Tables: **[Environment variables](./env.md)** (translation backends).

## Parallel translation (`--workers`)

| Source (CLI wins first) | Meaning |
|-------------------------|--------|
| **`--workers <n>`** | Hard override (clamped **1…64**). |
| **`I18NPRUNE_TRANSLATE_MAX_WORKERS`** | Env baseline when flag omitted. |
| **`translate.workers`** | Config baseline (integer **`≥ 1`**) when env + flag omit. |

With **`--workers` > 1**, core uses a bounded parallel translate pool then ordered replay (same final locale JSON as **`--workers 1`**). Details: **[Translation progress](../progress)**.

### Providers with strict quotas (429)

Free tiers (**`mymemory`**, etc.) return **`429`** quickly. **`--workers`** caps concurrency but not RPM; **`rateLimit`** / **`policy.throttle`** describe intended caps once enforcement ships — until then reduce **`--workers`**, widen spacing, retry, or change **`--provider`**.

When MyMemory returns quota text (e.g. *NEXT AVAILABLE IN ...*), i18nprune parses that wait window and includes it in failure messaging / issue payloads so operators can retry at a concrete time.

## Source of truth

- Zod: **`packages/cli/src/config/schema.ts`** — **`translate.workers`** must be a bare **integer** **`1…64`** (or omit for **`1`**). Objects / **`concurrency`** keys are **not** accepted.
- Merge: **`resolveTranslationProviderOptions`** (**`packages/cli/src/shared/translation/resolveProvider.ts`**).
- Concurrency: **`resolveTranslateMaxParallel`** (**`@i18nprune/core`**) · **`resolveCliTranslateMaxParallel`**.
- Troubleshooting: **[Issues — translate](../issues/translate.md)**.
