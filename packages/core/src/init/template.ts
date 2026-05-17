import type { InitLocaleLayoutHint, InitPresetId } from '../types/init/index.js';
import { DEFAULT_PROVIDER_RATE_LIMITS } from '../shared/translator/utils/orchestration.js';
import { getInitPresetConfigFields } from './presets/fields.js';

export type InitConfigFormat = 'ts' | 'mts' | 'js' | 'mjs';

/** Default import for **`defineConfig`** + **`I18nPruneConfig`** from core config surface. */
export const DEFAULT_INIT_CONFIG_IMPORT_SPECIFIER = 'i18nprune/core/config';

export type BuildInitConfigTemplateOptions = {
  /** Module specifier for **`defineConfig`** / **`I18nPruneConfig`** (default core config surface). */
  importSpecifier?: string;
  /** When true, include every supported top-level namespace with safe defaults (starting point for customization). */
  rich?: boolean;
  /**
   * Curated starter bundle — seeds **`locales.source`**, **`locales.directory`**, **`src`**, and **`functions`**.
   * Defaults to **`generic`**.
   */
  preset?: InitPresetId;
  /** When set, emitted into the `locales` block (from on-disk segment classification). */
  localeLayout?: InitLocaleLayoutHint | null;
};

/** Comment lines after **`{ id: 'google' }`** — uncomment one backend, enable it, align **`translate.primary`**, configure fields or env. */
function rateLimitLiteral(providerId: keyof typeof DEFAULT_PROVIDER_RATE_LIMITS): string {
  const d = DEFAULT_PROVIDER_RATE_LIMITS[providerId];
  return `{ maxConcurrency: ${String(d.maxConcurrency)}, rpm: ${String(d.rpm)}, rps: ${String(d.rps)}, intervalMs: ${String(d.intervalMs)} }`;
}

const GOOGLE_RATE_LIMIT_LITERAL = rateLimitLiteral('google');
const MYMEMORY_RATE_LIMIT_LITERAL = rateLimitLiteral('mymemory');
const LIBRE_RATE_LIMIT_LITERAL = rateLimitLiteral('libre');
const DEEPL_RATE_LIMIT_LITERAL = rateLimitLiteral('deepl');
const LLM_RATE_LIMIT_LITERAL = rateLimitLiteral('llm');

const TRANSLATE_PROVIDER_COMMENT_ROWS = `
      // The order of \`providers[]\` IS the auto-routing chain (\`policy.routing: 'auto'\` walks
      // top-to-bottom on retryable failures). \`--provider\` / \`I18NPRUNE_TRANSLATE_PROVIDER\`
      // pins an id to the FRONT of the chain without disabling fallback. Set \`enabled: false\`
      // (or comment the row) to skip a provider.
      // Uncomment one row at a time · set \`translate.primary\` · use env vars where noted (run \`i18nprune providers\`).
      // { id: 'mymemory', enabled: true, contactEmail: 'you@example.com', rateLimit: ${MYMEMORY_RATE_LIMIT_LITERAL} },
      // { id: 'libre', enabled: true, baseUrl: 'https://libretranslate.com', rateLimit: ${LIBRE_RATE_LIMIT_LITERAL} },
      // { id: 'deepl', enabled: true, apiKey: process.env.I18NPRUNE_TRANSLATE_DEEPL_API_KEY, rateLimit: ${DEEPL_RATE_LIMIT_LITERAL} },
      // {
      //   id: 'llm',
      //   enabled: true,
      //   apiKey: process.env.I18NPRUNE_TRANSLATE_LLM_API_KEY,
      //   baseUrl: process.env.I18NPRUNE_TRANSLATE_LLM_BASE_URL ?? 'https://api.openai.com/v1',
      //   model: process.env.I18NPRUNE_TRANSLATE_LLM_MODEL ?? 'gpt-4o-mini',
      //   rateLimit: ${LLM_RATE_LIMIT_LITERAL},
      // },`;

const TRANSLATE_POLICY_BLOCK = `
    // Per-outcome verbs consumed by the translate-policy resolver. All keys optional — these are the safe defaults.
    policy: {
      routing: 'single',
      onRateLimit: 'backoff',
      onTransientFailure: 'retry',
      onQuotaExceeded: 'fallback',
      onAuthFailure: 'abort',
      onProviderUnavailable: 'fallback',
      onIdentityOutput: 'flag',
      onIncompleteRun: 'confirm',
      handoff: 'auto',
      // maxAttempts: providers.length, // omit to use one shot per provider in chain
    },`;

function formatFunctionsArray(functions: string[]): string {
  return JSON.stringify(functions);
}

function formatLocaleLayoutLines(layout: InitLocaleLayoutHint | null | undefined): string {
  if (!layout) return '';
  return `
    mode: '${layout.mode}',
    structure: '${layout.structure}',`;
}

function formatPresetBody(preset: InitPresetId, localeLayout?: InitLocaleLayoutHint | null): string {
  const p = getInitPresetConfigFields(preset);
  const sf = p.locales.source.replace(/'/g, "\\'");
  const dir = p.locales.directory.replace(/'/g, "\\'");
  const layoutLines = formatLocaleLayoutLines(localeLayout);
  return `  locales: {
    source: '${sf}',
    directory: '${dir}',${layoutLines}
  },
  src: '${p.src.replace(/'/g, "\\'")}',
  functions: ${formatFunctionsArray(p.functions)},`;
}

function buildMinimalInitConfigTemplate(
  importSpecifier: string,
  preset: InitPresetId,
  localeLayout?: InitLocaleLayoutHint | null,
): string {
  const body = formatPresetBody(preset, localeLayout);
  return `import { defineConfig, type I18nPruneConfig } from '${importSpecifier}';

export default defineConfig({
${body}
  translate: {
    primary: 'google',
    workers: ${String(DEFAULT_PROVIDER_RATE_LIMITS.google.maxConcurrency)},
    providers: [{ id: 'google', rateLimit: ${GOOGLE_RATE_LIMIT_LITERAL} },${TRANSLATE_PROVIDER_COMMENT_ROWS}
    ],${TRANSLATE_POLICY_BLOCK}
  },
  policies: {
    preserve: {
      // copyKeys: ['brand.tagline'],
      // copyPrefixes: ['legal.'],
    },
    parity: {
      // excludeKeys: ['debug.flag'],
      // excludePrefixes: ['experimental.'],
      // excludeValues: ['TODO'],
    },
  },
  exclude: {
    preset: 'production',
    useDefaultSkip: true,
    // dirs: ['fixtures'],
    // extensions: ['d.ts'],
    // patterns: [/^src\\/generated\\//],
  },
} satisfies Partial<I18nPruneConfig>);
`;
}

function buildRichInitConfigTemplate(
  importSpecifier: string,
  preset: InitPresetId,
  localeLayout?: InitLocaleLayoutHint | null,
): string {
  const body = formatPresetBody(preset, localeLayout);
  return `import { defineConfig, type I18nPruneConfig } from '${importSpecifier}';

export default defineConfig({
${body}
  translate: {
    primary: 'google',
    workers: ${String(DEFAULT_PROVIDER_RATE_LIMITS.google.maxConcurrency)},
    providers: [
      { id: 'google', rateLimit: ${GOOGLE_RATE_LIMIT_LITERAL} },${TRANSLATE_PROVIDER_COMMENT_ROWS}
    ],
    // Per-outcome verbs consumed by the translate-policy resolver. All keys optional.
    policy: {
      routing: 'single',
      onRateLimit: 'backoff',
      onTransientFailure: 'retry',
      onQuotaExceeded: 'fallback',
      onAuthFailure: 'abort',
      onProviderUnavailable: 'fallback',
      onIdentityOutput: 'flag',
      onIncompleteRun: 'confirm',
      handoff: 'auto',
      // maxAttempts: providers.length, // omit to use one shot per provider in chain
    },
  },

  policies: {
    preserve: {
      // copyKeys: ['brand.tagline'],
      // copyPrefixes: ['legal.'],
    },
    parity: {
      // excludeKeys: ['debug.flag'],
      // excludePrefixes: ['experimental.'],
      // excludeValues: ['TODO'],
    },
  },

  exclude: {
    preset: 'production',
    useDefaultSkip: true,
    // dirs: ['fixtures', 'vendor'],
    // files: ['ignored-keys.ts'],
    // extensions: ['d.ts'],
    // patterns: [/^src\\/generated\\//],
  },

  reference: {
    defaults: {
      treatCommentedCallSitesAsRuntime: false,
      treatNonSourceFileSitesAsRuntime: false,
      uncertainKeyPolicy: 'protect',
      stringPresence: 'guard',
      stringPresenceMaxHitsPerKey: 5,
      respectPreserve: true,
    },
    // Per-command overrides: add \`commands: { cleanup?: {…}, sync?: {…}, generate?: {…} }\` using the SAME field keys as \`defaults\`.
    // Each block shallow-merges over \`defaults\` when that command runs (documented keys only; omit \`commands\` until you need a divergence).
    // See repo \`docs/reference/\` and types \`ReferenceConfig\` via \`i18nprune/core/config\`.
  },

  localeLeaves: {
    // \`mode\`: **\`legacy_string\`** (plain string leaves) or **\`structured\`** (\`{ value, … }\` terminals) — only these two values are valid.
    mode: 'legacy_string',
    sync: {
      // When **\`true\`**, sync can strip structured metadata back to plain strings (see \`sync --strip-metadata\`).
      stripMetadata: false,
    },
  },

  missing: {
    // Omit \`placeholder\` → core default __I18NPRUNE_MISSING__; set any string you want merged at new paths (grep-friendly sentinel recommended).
    placeholder: '__I18NPRUNE_MISSING__',
  },
  output: {
    list: {
      top: 10,
      full: false,
      // maxCap: 100000,
    },
  },

  scanner: {
    // \`auto\` picks serial vs concurrent; tune for huge repos.
    mode: 'auto',
    // concurrency: 8,
    // hardCap: 256,
  },

  cache: {
    // Core-owned project analysis cache. Omit \`dir\` to use the host default (CLI: ~/.i18nprune/cache).
    enabled: true,
    // dir: '.i18nprune/cache',
    // mode: 'readWrite', // 'readOnly' skips all cache writes (useful for CI audit runs).
  },

  patching: {
    // Opt-in: may create/refresh loader wiring under \`src\` — keep \`enabled: false\` until you deliberately adopt the patching recipe.
    enabled: false,
    recipe: 'loader_generated',
    mode: 'warn_skip',
    // loaderPath: 'src/i18n/loaders.generated.ts',
    // configPath: 'src/i18n/config.json',
    // localeJsonImportBase: 'locales',
    // sizeLimitBytes: 524288,
  },

  // When \`true\`, \`generate\` skips **\`<lang>.meta.json\`** (same effect as CLI \`--no-locale-meta\`; either skips).
  noLocaleMeta: false,

} satisfies Partial<I18nPruneConfig>);
`;
}

/** Starter config template used by \`init\` when writing a new config file. */
export function buildInitConfigTemplate(importSpecifierOrOpts?: string | BuildInitConfigTemplateOptions): string {
  if (typeof importSpecifierOrOpts === 'string') {
    return buildMinimalInitConfigTemplate(importSpecifierOrOpts, 'generic');
  }
  const opts = importSpecifierOrOpts ?? {};
  const importSpecifier = opts.importSpecifier ?? DEFAULT_INIT_CONFIG_IMPORT_SPECIFIER;
  const preset = opts.preset ?? 'generic';
  const layout = opts.localeLayout;
  return opts.rich
    ? buildRichInitConfigTemplate(importSpecifier, preset, layout)
    : buildMinimalInitConfigTemplate(importSpecifier, preset, layout);
}

export function configFileNameForFormat(baseName: string, format: InitConfigFormat): string {
  return `${baseName}.${format}`;
}

export function defaultInitConfigFileName(baseName: string): string {
  return configFileNameForFormat(baseName, 'ts');
}
