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

const configSchema = z.object({
  source: z.string(),
  localesDir: z.string(),
  src: z.string(),
  functions: z.array(z.string()).min(1),
  sourceLocaleCode: z.string().optional(),
  reportFormat: z.enum(['json', 'text', 'csv']).optional(),
  policies: policiesSchema,
});

export type ParsedI18nPruneConfig = z.infer<typeof configSchema>;

export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly zodError?: z.ZodError,
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export function parseI18nPruneConfig(raw: unknown): ParsedI18nPruneConfig {
  const r = configSchema.safeParse(raw);
  if (!r.success) {
    throw new ConfigValidationError(
      `Invalid i18nprune config: ${r.error.message}`,
      r.error,
    );
  }
  return r.data;
}
