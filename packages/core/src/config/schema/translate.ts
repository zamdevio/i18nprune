import { z } from 'zod';
import { TRANSLATE_WORKERS_CAP } from '../../shared/translator/utils/orchestration.js';
import { TRANSLATE_POLICY_DEFAULTS } from '../../types/translator/policy.js';

/** Clamp `translate.workers` / CLI `--workers` to `1…64`. */
export function clampTranslateMaxWorkers(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(TRANSLATE_WORKERS_CAP, Math.max(1, Math.trunc(n)));
}

const translateThrottleSchema = z
  .object({
    maxConcurrency: z
      .number()
      .int()
      .positive()
      .max(TRANSLATE_WORKERS_CAP)
      .optional()
      .describe('Cap parallel translateLeaf calls for this row (core merges with CLI --workers / translate.workers).'),
    rpm: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Vendor-friendly requests/minute ceiling (enforced when orchestration supports it).'),
    rps: z
      .number()
      .positive()
      .optional()
      .describe('Optional requests/second ceiling (can be fractional, e.g. 0.5 = 1 request every 2 seconds).'),
    intervalMs: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Minimum spacing between requests originating from this row / merged defaults.'),
  })
  .strict()
  .transform((t) => ({
    maxConcurrency: t.maxConcurrency,
    rpm: t.rpm,
    rps: t.rps,
    intervalMs: t.intervalMs,
  }));

const translateGoogleRowSchema = z
  .object({
    id: z.literal('google'),
    enabled: z.boolean().optional().describe('When false, row is ignored for merges (rich-init scaffolding).'),
    rateLimit: translateThrottleSchema.optional(),
  })
  .strict()
  .describe('Google Translate web (gtx) backend.');

const translateMymemoryRowSchema = z
  .object({
    id: z.literal('mymemory'),
    enabled: z.boolean().optional(),
    contactEmail: z.string().optional().describe('Fair-use contact email for MyMemory API attribution.'),
    rateLimit: translateThrottleSchema.optional(),
  })
  .strict();

const translateLibreRowSchema = z
  .object({
    id: z.literal('libre'),
    enabled: z.boolean().optional(),
    baseUrl: z.string().optional().describe('LibreTranslate base URL when not using the public instance.'),
    rateLimit: translateThrottleSchema.optional(),
  })
  .strict();

const translateDeeplRowSchema = z
  .object({
    id: z.literal('deepl'),
    enabled: z.boolean().optional(),
    apiKey: z.string().optional().describe('DeepL API key (or set via env; see docs).'),
    rateLimit: translateThrottleSchema.optional(),
  })
  .strict();

const translateLlmRowSchema = z
  .object({
    id: z.literal('llm'),
    enabled: z.boolean().optional(),
    apiKey: z.string().optional().describe('Bearer / API key for the OpenAI-compatible endpoint.'),
    baseUrl: z.string().optional().describe('Base URL including /v1 when required by the host.'),
    model: z.string().optional().describe('Chat model id for completions.'),
    rateLimit: translateThrottleSchema.optional(),
  })
  .strict();

const translateProviderRowSchema = z.discriminatedUnion('id', [
  translateGoogleRowSchema,
  translateMymemoryRowSchema,
  translateLibreRowSchema,
  translateDeeplRowSchema,
  translateLlmRowSchema,
]);

const translatePrimaryIdSchema = z.enum(['google', 'mymemory', 'libre', 'deepl', 'llm']);

/**
 * Locked translate-policy schema. Each `on*` key takes a single verb from
 * {@link TranslatePolicyVerb}. Source: `translate-policy (shipped)` §3.
 *
 * `.strict()` rejects typos. All keys optional — defaults are
 * {@link TRANSLATE_POLICY_DEFAULTS} except `maxAttempts`, which resolves to
 * `providers.length` in the parent transform once the chain is known.
 */
const translatePolicySchema = z
  .object({
    routing: z
      .enum(['single', 'auto'])
      .default(TRANSLATE_POLICY_DEFAULTS.routing)
      .describe(
        'single: one backend per run. auto: ordered fallback chain across enabled providers for retryable backend failures.',
      ),
    onRateLimit: z
      .enum(['backoff', 'retry', 'fallback', 'abort'])
      .default(TRANSLATE_POLICY_DEFAULTS.onRateLimit)
      .describe('Action for HTTP 429 / "too many requests" outcomes.'),
    onTransientFailure: z
      .enum(['retry', 'fallback', 'abort'])
      .default(TRANSLATE_POLICY_DEFAULTS.onTransientFailure)
      .describe('Action for transient network blips and ECONNRESET-style errors.'),
    onQuotaExceeded: z
      .enum(['fallback', 'prompt', 'abort'])
      .default(TRANSLATE_POLICY_DEFAULTS.onQuotaExceeded)
      .describe('Action when the provider explicitly reports daily/monthly quota exhausted.'),
    onAuthFailure: z
      .enum(['abort', 'prompt'])
      .default(TRANSLATE_POLICY_DEFAULTS.onAuthFailure)
      .describe('Action for HTTP 401 / 403 — never silently swap on credential failure.'),
    onProviderUnavailable: z
      .enum(['fallback', 'abort'])
      .default(TRANSLATE_POLICY_DEFAULTS.onProviderUnavailable)
      .describe('Action for sustained 5xx / DNS unavailable.'),
    onIdentityOutput: z
      .enum(['flag', 'fallback', 'abort'])
      .default(TRANSLATE_POLICY_DEFAULTS.onIdentityOutput)
      .describe('Action when the provider returned the source string unchanged.'),
    onIncompleteRun: z
      .enum(['confirm', 'write', 'discard'])
      .default(TRANSLATE_POLICY_DEFAULTS.onIncompleteRun)
      .describe('Action when a run cannot finish all leaves (cap hit or interrupt).'),
    maxAttempts: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        'Cross-provider attempts per leaf. When omitted, defaults to providers.length at parse time.',
      ),
    handoff: z
      .enum(['auto', 'on', 'off'])
      .default(TRANSLATE_POLICY_DEFAULTS.handoff)
      .describe('Mid-run rescue picker: auto = TTY-only when routing=single; on = always TTY; off = never.'),
  })
  .strict()
  .describe('Translation orchestration: routing + per-outcome actions consumed by the policy resolver.');

const translateWorkersField = z
  .number()
  .int()
  .positive()
  .max(TRANSLATE_WORKERS_CAP)
  .describe('Max parallel translateLeaf calls when --workers flag and env omit (1 = serial).');

const translateInnerSchema = z
  .object({
    primary: translatePrimaryIdSchema.describe(
      'Default backend when CLI --provider and I18NPRUNE_TRANSLATE_PROVIDER omit; must match an enabled providers[] row.',
    ),
    providers: z.array(translateProviderRowSchema).min(1),
    policy: translatePolicySchema.default({ ...TRANSLATE_POLICY_DEFAULTS }),
    workers: translateWorkersField.optional(),
  })
  .strict()
  .transform((t) => ({
    primary: t.primary,
    providers: t.providers,
    /**
     * `maxAttempts` defaults to `providers.length` (one shot per provider in chain) per
     * `translate-policy (shipped)` §6. Resolved here because the default
     * depends on a sibling field — Zod's static `.default()` can't express that.
     */
    policy: { ...t.policy, maxAttempts: t.policy.maxAttempts ?? t.providers.length },
    workers: t.workers ?? 1,
  }))
  .superRefine((data, ctx) => {
    const ids = data.providers.map((p) => p.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'translate.providers must not contain duplicate id values',
        path: ['providers'],
      });
    }
    const primaryRow = data.providers.find((p) => p.id === data.primary && p.enabled !== false);
    if (!primaryRow) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'translate.primary must match at least one translate.providers entry with enabled !== false',
        path: ['primary'],
      });
    }
  })
  .describe('Translation registry + orchestration policy for generate (including `generate --resume`).');

export const translateSchema = translateInnerSchema
  .optional()
  .describe(
    'Optional translate namespace; omit entirely to follow env + built-in default (google) without file-backed rows.',
  );
