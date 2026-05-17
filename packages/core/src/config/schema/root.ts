/**
 * Zod schema for `i18nprune` project config. Field `.describe()` text is surfaced in parse errors
 * and documents the runtime shape of `I18nPruneConfig`.
 */
import { z } from 'zod';
import { translateSchema } from './translate.js';
import type { ReferenceConfig as CoreReferenceConfig } from '../../types/reference/index.js';
import type { ParityPolicy, PreservePolicy } from '../../types/policies/index.js';
import type { ScanExcludeConfig, ScannerConfigInput } from '../../types/scanner/index.js';
import type { PatchingConfigInput } from '../../types/patching/index.js';
import type { TranslationProviderId } from '../../types/translator/providers.js';
import type { TranslatePolicy } from '../../types/translator/policy.js';

const preserveSchema = z
  .object({
    copyKeys: z
      .array(z.string())
      .optional()
      .describe('Locale key paths that must mirror the source locale verbatim (exact matches).'),
    copyPrefixes: z
      .array(z.string())
      .optional()
      .describe('Key path prefixes treated like copyKeys (prefix match).'),
  })
  .optional()
  .describe('Preserve policy: keys/prefixes that must not be freely translated or drifted.');

const paritySchema = z
  .object({
    excludeKeys: z
      .array(z.string())
      .optional()
      .describe('Key paths excluded from source-identical / drift checks (exact).'),
    excludePrefixes: z
      .array(z.string())
      .optional()
      .describe('Key path prefixes excluded from parity checks.'),
    excludeValues: z
      .array(z.string())
      .optional()
      .describe('Locale string values excluded from parity checks.'),
  })
  .optional()
  .describe('Parity policy: exclusions for “same as source” style checks.');

const policiesSchema = z
  .object({
    preserve: preserveSchema,
    parity: paritySchema,
  })
  .optional()
  .describe('High-level preserve / parity rules used across sync, quality, cleanup, generate, etc.');

const missingCommandSchema = z
  .object({
    placeholder: z
      .string()
      .optional()
      .describe('String merged at each new key path for missing; omit for built-in sentinel.'),
  })
  .strict()
  .optional()
  .describe('Defaults for the missing command.');

const outputSchema = z
  .object({
    list: z
      .object({
        top: z
          .number()
          .int()
          .positive()
          .max(100_000)
          .optional()
          .describe('Default max rows for bounded human lists when --top is omitted.'),
        full: z
          .boolean()
          .optional()
          .describe('When true, show all rows where the command supports it.'),
        maxCap: z
          .number()
          .int()
          .positive()
          .max(1_000_000)
          .optional()
          .describe('Hard ceiling for list size even when full is used.'),
      })
      .strict()
      .optional()
      .describe('Human-readable list caps for previews and summaries.'),
  })
  .strict()
  .optional()
  .describe('CLI-wide defaults for human list-style output.');

const referenceDefaultsSchema = z
  .object({
    treatCommentedCallSitesAsRuntime: z
      .boolean()
      .optional()
      .describe('When false, translation calls inside comments do not count as runtime evidence.'),
    treatNonSourceFileSitesAsRuntime: z
      .boolean()
      .optional()
      .describe('When false, non-source file call sites are ignored for uncertainty.'),
    uncertainKeyPolicy: z
      .enum(['protect', 'allow', 'warn_only'])
      .optional()
      .describe('How dynamic / uncertain key prefixes are handled (protect is safest).'),
    stringPresence: z
      .enum(['guard', 'warn', 'off'])
      .optional()
      .describe('Whether ripgrep checks locale strings in src before destructive cleanup.'),
    stringPresenceMaxHitsPerKey: z
      .number()
      .int()
      .positive()
      .max(1000)
      .optional()
      .describe('Max rg JSON matches recorded per key (performance cap).'),
    respectPreserve: z
      .boolean()
      .optional()
      .describe('When true, `generate --resume` skips paths matching policies.preserve (same as full generate).'),
  })
  .passthrough()
  .describe('Reference / uncertainty policy fields (defaults or per-operation override).');

const referenceCommandsSchema = z
  .object({
    cleanup: referenceDefaultsSchema
      .optional()
      .describe('Overrides reference.defaults when running i18nprune cleanup.'),
    sync: referenceDefaultsSchema
      .optional()
      .describe('Overrides reference.defaults when running i18nprune sync.'),
    generate: referenceDefaultsSchema
      .optional()
      .describe('Overrides reference.defaults when running i18nprune generate (including `generate --resume`).'),
  })
  .passthrough()
  .describe(
    'Per-operation reference overrides. Supported keys: cleanup, sync, generate. Unknown keys are preserved for forward compatibility.',
  )
  .optional();

const referenceSchema = z
  .object({
    defaults: referenceDefaultsSchema
      .optional()
      .describe('Baseline merged before reference.commands.<operation> for each operation.'),
    commands: referenceCommandsSchema,
  })
  .passthrough()
  .optional()
  .describe('Uncertainty and string-presence policy: defaults plus optional per-operation blocks.');

const excludeSchema = z
  .object({
    preset: z
      .enum(['production'])
      .optional()
      .describe('Built-in preset for common production skip sets (when defined).'),
    dirs: z
      .array(z.union([z.string(), z.instanceof(RegExp)]))
      .optional()
      .describe('Directory names or regexes to skip while scanning.'),
    files: z
      .array(z.union([z.string(), z.instanceof(RegExp)]))
      .optional()
      .describe('File paths or regexes to skip.'),
    extensions: z
      .array(z.union([z.string(), z.instanceof(RegExp)]))
      .optional()
      .describe('File extensions to skip.'),
    patterns: z
      .array(z.instanceof(RegExp))
      .optional()
      .describe('Path regexes to skip under src.'),
    useDefaultSkip: z
      .boolean()
      .optional()
      .describe('When true, apply built-in directory skips (node_modules, dist, etc.).'),
  })
  .strict()
  .optional()
  .describe('Scanner skip rules beyond CLI flags.');

const scannerSchema = z
  .object({
    mode: z
      .enum(['serial', 'concurrent', 'auto'])
      .optional()
      .describe('Scan worker layout: serial, concurrent, or auto-tuned.'),
    concurrency: z
      .number()
      .int()
      .positive()
      .max(4096)
      .optional()
      .describe('Worker count hint when mode is concurrent or auto.'),
    hardCap: z
      .number()
      .int()
      .positive()
      .max(4096)
      .optional()
      .describe('Upper bound on concurrent units (core may clamp).'),
  })
  .strict()
  .optional()
  .describe('Optional scan orchestration hints.');

const cacheSchema = z
  .object({
    enabled: z.boolean().optional().describe('Master switch for core-owned project analysis cache.'),
    dir: z
      .string()
      .optional()
      .describe('Cache root directory. Relative paths resolve from the project root; omit to use the host default.'),
    mode: z
      .enum(['readWrite', 'readOnly'])
      .optional()
      .describe(
        'readWrite (default): cache may persist hits and misses. readOnly: reuse valid cache on disk but skip all cache writes (meta, files index, snapshots).',
      ),
  })
  .strict()
  .optional()
  .describe('Project cache policy shared by core operations. Hosts provide runtime adapters and the default root.');

const localeLeavesSchema = z
  .object({
    mode: z
      .enum(['structured', 'legacy_string'])
      .optional()
      .describe('JSON leaf shape: structured objects vs plain strings.'),
    sync: z
      .object({
        stripMetadata: z
          .boolean()
          .optional()
          .describe('When true, sync may strip structured metadata back to plain strings.'),
      })
      .strict()
      .optional()
      .describe('Options that apply when running sync.'),
  })
  .strict()
  .optional()
  .describe('How sync and generate read/write JSON terminals.');

/** Locale bundle paths and optional storage layout (flat files today; directory topologies later). */
export const localesFilesystemSchema = z
  .object({
    source: z
      .string()
      .describe('Path to the source-of-truth locale JSON (e.g. locales/en.json), relative to the config file directory.'),
    directory: z
      .string()
      .describe('Directory containing locale *.json files (and optional .meta.json sidecars), relative to the config file directory.'),
    mode: z
      .enum(['flat_file', 'locale_directory'])
      .optional()
      .describe('Filesystem layout: `flat_file` is one JSON file per locale code under `directory`.'),
    structure: z
      .enum(['locale_file', 'locale_per_dir', 'feature_bundle'])
      .optional()
      .describe('How multiple JSON files group into one logical locale.'),
  })
  .strict()
  .describe('Locale files on disk: source document + bundle root, with optional topology hints.');

export type LocalesFilesystemConfig = z.infer<typeof localesFilesystemSchema>;

const patchingSchema = z
  .object({
    enabled: z.boolean().optional().describe('Master switch for loader / generated-file patching.'),
    recipe: z
      .enum(['loader_generated'])
      .optional()
      .describe('Which patching recipe to run when enabled.'),
    loaderPath: z.string().optional().describe('Path to generated patching loader output (for example src/i18n/loaders.generated.ts).'),
    configPath: z.string().optional().describe('Path to JSON consumed by the loader.'),
    localeJsonImportBase: z
      .string()
      .optional()
      .describe(
        'Path to the locales directory relative to the folder that contains i18nprune.config.* (often the repo root). Core computes import() URLs inside loaders.generated.ts from this.',
      ),
    sizeLimitBytes: z
      .number()
      .int()
      .positive()
      .max(16 * 1024 * 1024)
      .optional()
      .describe('Max bytes to read when patching (safety).'),
    mode: z
      .enum(['warn_skip', 'strict'])
      .optional()
      .describe('warn_skip logs and continues on oversize; strict fails the run.'),
  })
  .strict()
  .optional()
  .describe('Auto-patch loader wiring for patch / generate --patch.');

export const configSchema = z
  .object({
    locales: localesFilesystemSchema,
    src: z.string().describe('Root directory scanned for translation helper calls.'),
    functions: z
      .array(z.string())
      .min(1)
      .describe('Function names treated as translation entry points (e.g. t).'),
    noLocaleMeta: z
      .boolean()
      .optional()
      .describe('When true, generate skips writing <lang>.meta.json sidecars.'),
    exclude: excludeSchema,
    output: outputSchema,
    scanner: scannerSchema,
    cache: cacheSchema,
    policies: policiesSchema,
    reference: referenceSchema,
    localeLeaves: localeLeavesSchema,
    patching: patchingSchema,
    missing: missingCommandSchema,
    translate: translateSchema,
  })
  .describe('i18nprune project configuration (merged with defaults then validated by parseI18nPruneConfig).');

/**
 * Direct **`z.infer`** of {@link configSchema}. Internal — used by **`schema/define.ts`** /
 * **`defaults/app.ts`** to type the spread / merge bodies. Public callers should use the friendly
 * **`I18nPruneConfig`** from **`@i18nprune/core/config`** (or the root barrel).
 *
 * The two shapes are runtime-identical; the friendly version retypes **`reference`**,
 * **`translate`**, and **`policies`** with stricter authoring-time interfaces.
 */
export type I18nPruneConfigParsed = z.infer<typeof configSchema>;

/** Optional per-backend rate-limit knobs (merged with provider defaults when omitted). */
export type TranslateRateLimitConfig = {
  maxConcurrency?: number;
  rpm?: number;
  rps?: number;
  intervalMs?: number;
};

export type TranslateProviderRowGoogle = {
  id: 'google';
  enabled?: boolean;
  rateLimit?: TranslateRateLimitConfig;
};

export type TranslateProviderRowMymemory = {
  id: 'mymemory';
  enabled?: boolean;
  contactEmail?: string;
  rateLimit?: TranslateRateLimitConfig;
};

export type TranslateProviderRowLibre = {
  id: 'libre';
  enabled?: boolean;
  baseUrl?: string;
  rateLimit?: TranslateRateLimitConfig;
};

export type TranslateProviderRowDeepL = {
  id: 'deepl';
  enabled?: boolean;
  apiKey?: string;
  rateLimit?: TranslateRateLimitConfig;
};

export type TranslateProviderRowLlm = {
  id: 'llm';
  enabled?: boolean;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  rateLimit?: TranslateRateLimitConfig;
};

export type TranslateProviderRow =
  | TranslateProviderRowGoogle
  | TranslateProviderRowMymemory
  | TranslateProviderRowLibre
  | TranslateProviderRowDeepL
  | TranslateProviderRowLlm;

export type TranslateMaxWorkersConfig = number;
export type TranslatePolicyConfig = TranslatePolicy;
export type { ParityPolicy, PreservePolicy };

export type Policies = {
  preserve?: PreservePolicy;
  parity?: ParityPolicy;
};

export type LocaleLeavesConfig = {
  mode?: 'structured' | 'legacy_string';
  sync?: {
    stripMetadata?: boolean;
  };
};

export type MissingCommandConfig = {
  placeholder?: string;
};

export type OutputListConfig = {
  top?: number;
  full?: boolean;
  maxCap?: number;
};

export type OutputConfig = {
  list?: OutputListConfig;
};

export type CacheConfig = {
  enabled?: boolean;
  dir?: string;
  mode?: 'readWrite' | 'readOnly';
};

export type PatchingConfig = PatchingConfigInput;

export type TranslateConfig = {
  primary: TranslationProviderId;
  providers: TranslateProviderRow[];
  policy?: TranslatePolicyConfig;
  workers?: TranslateMaxWorkersConfig;
};

/**
 * Fully merged i18nprune project config (file + defaults + parse normalization).
 */
export type I18nPruneConfig = Omit<I18nPruneConfigParsed, 'reference' | 'translate' | 'policies'> & {
  locales: LocalesFilesystemConfig;
  src: string;
  functions: string[];
  noLocaleMeta?: boolean;
  output?: OutputConfig;
  cache?: CacheConfig;
  exclude?: ScanExcludeConfig;
  scanner?: ScannerConfigInput;
  policies?: Policies;
  reference?: CoreReferenceConfig;
  localeLeaves?: LocaleLeavesConfig;
  missing?: MissingCommandConfig;
  patching?: PatchingConfig;
  translate?: TranslateConfig;
};

/**
 * Thrown by **`parseI18nPruneConfig`** (and **`loadCoreConfigFromPath`**) when an input value
 * fails the zod schema. Carries the underlying **`zodError`** so callers can surface field-level
 * issues (CLI uses it to emit **`ConfigValidationError`** issue codes).
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly zodError?: z.ZodError,
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validate a raw object against the zod-backed config schema and return the public friendly
 * **`I18nPruneConfig`**. Throws **`ConfigValidationError`** on invalid input.
 *
 * Use this when accepting config from untrusted sources (REST, DB, CLI args, generated
 * fixtures). For files on disk prefer **`loadCoreConfigFromPath`** — it handles TS / JS
 * loaders, layering with **`DEFAULT_CONFIG`**, and warning collection on top of this primitive.
 *
 * The returned value drops straight into **`createCoreContext`** and **`createTranslateContext`**
 * with no further cast.
 *
 * @example
 * ```ts
 * import { parseI18nPruneConfig } from '@i18nprune/core';
 *
 * const config = parseI18nPruneConfig(await db.fetchProjectConfig(projectId));
 * const ctx = createCoreContext({ config, adapters, env, paths });
 * ```
 */
export function parseI18nPruneConfig(raw: unknown): I18nPruneConfig {
  const r = configSchema.safeParse(raw);
  if (!r.success) {
    throw new ConfigValidationError(
      `Invalid i18nprune config: ${r.error.message}`,
      r.error,
    );
  }
  // Same runtime data as `I18nPruneConfigParsed`; the friendly view re-types a few fields with
  // stricter authoring interfaces (no shape change, no field removed/added).
  return r.data as I18nPruneConfig;
}
