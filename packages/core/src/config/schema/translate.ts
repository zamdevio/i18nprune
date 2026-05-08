import { z } from 'zod';
import { TRANSLATE_WORKERS_CAP } from '../../shared/translator/utils/orchestration.js';

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

const translatePolicySchema = z
  .object({
    routing: z
      .enum(['single', 'auto'])
      .default('single')
      .describe('single: one backend per run. auto: ordered fallback chain across enabled providers for retryable backend failures.'),
    onRateLimitResponse: z
      .enum(['backoff', 'fail'])
      .default('backoff')
      .describe('How HTTP 429-heavy runs should behave once orchestration reads this flag.'),
    onTransientFailure: z
      .enum(['retry', 'fail'])
      .default('retry')
      .describe('How intermittent network / 5xx behaviour is classified once orchestration reads this flag.'),
  })
  .strict()
  .describe('Translation orchestration: routing presets and failure posture (orchestrator reads these).');

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
    policy: translatePolicySchema.default({
      routing: 'single',
      onRateLimitResponse: 'backoff',
      onTransientFailure: 'retry',
    }),
    workers: translateWorkersField.optional(),
  })
  .strict()
  .transform((t) => ({
    primary: t.primary,
    providers: t.providers,
    policy: t.policy,
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
  .describe('Translation registry + orchestration policy for generate and fill.');

export const translateSchema = translateInnerSchema
  .optional()
  .describe(
    'Optional translate namespace; omit entirely to follow env + built-in default (google) without file-backed rows.',
  );
