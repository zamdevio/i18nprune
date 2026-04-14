import { z } from 'zod';

const preserveSchema = z
  .object({
    copyKeys: z.array(z.string()).optional(),
    copyPrefixes: z.array(z.string()).optional(),
  })
  .optional();

const paritySchema = z
  .object({
    excludeKeys: z.array(z.string()).optional(),
    excludePrefixes: z.array(z.string()).optional(),
    excludeValues: z.array(z.string()).optional(),
  })
  .optional();

const policiesSchema = z
  .object({
    preserve: preserveSchema,
    parity: paritySchema,
  })
  .optional();

/** Reserved namespace for `validate` command–specific options (unknown keys allowed for forward compatibility). */
const validateCommandSchema = z.object({}).passthrough().optional();

const missingCommandSchema = z
  .object({
    displayDefaultTop: z.number().int().positive().max(100_000).optional(),
  })
  .strict()
  .optional();

const referenceDefaultsSchema = z
  .object({
    treatCommentedCallSitesAsRuntime: z.boolean().optional(),
    treatNonSourceFileSitesAsRuntime: z.boolean().optional(),
    uncertainKeyPolicy: z.enum(['protect', 'allow', 'warn_only']).optional(),
    stringPresence: z.enum(['guard', 'warn', 'off']).optional(),
    stringPresenceMaxHitsPerKey: z.number().int().positive().max(1000).optional(),
    respectPreserve: z.boolean().optional(),
  })
  .passthrough();

const referenceSchema = z
  .object({
    defaults: referenceDefaultsSchema.optional(),
    commands: z.record(z.string(), referenceDefaultsSchema.optional()).optional(),
  })
  .passthrough()
  .optional();

export const configSchema = z.object({
  source: z.string(),
  localesDir: z.string(),
  src: z.string(),
  functions: z.array(z.string()).min(1),
  sourceLocaleCode: z.string().optional(),
  reportFormat: z.enum(['json', 'text', 'csv']).optional(),
  policies: policiesSchema,
  reference: referenceSchema,
  validate: validateCommandSchema,
  missing: missingCommandSchema,
});

export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly zodError?: z.ZodError,
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export function parseI18nPruneConfig(raw: unknown): import('@/types/config/schema.js').ParsedI18nPruneConfig {
  const r = configSchema.safeParse(raw);
  if (!r.success) {
    throw new ConfigValidationError(
      `Invalid i18nprune config: ${r.error.message}`,
      r.error,
    );
  }
  return r.data;
}
