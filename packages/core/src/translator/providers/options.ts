/**
 * Resolve the **effective** translation provider id and per-id credential bundle.
 *
 * Pure: callers supply the **`config.translate`** block plus an **`env`** map. Core never reads
 * **`process.*`**. Hosts (CLI / Worker) pass their own env (e.g. **`process.env`**, **`Worker bindings`**).
 */

import { I18nPruneError } from '../../shared/errors/index.js';
import {
  ISSUE_TRANSLATE_MISSING_CREDENTIALS,
  ISSUE_TRANSLATE_UNKNOWN_TRANSLATION_PROVIDER,
} from '../../shared/constants/issueCodes.js';
import {
  defaultResolvedTranslationOptions,
  isTranslationProviderId,
  listTranslationProviders,
  validateResolvedTranslationOptions,
} from '../../shared/translator/providers/registry.js';
import type { TranslateConfigInput, TranslateProviderRowInput } from '../../types/config/index.js';
import type {
  ResolvedTranslationProviderOptions,
  TranslationProviderId,
} from '../../types/translator/providers.js';
import {
  ENV_TRANSLATE_DEEPL_API_KEY,
  ENV_TRANSLATE_LIBRE_URL,
  ENV_TRANSLATE_LLM_API_KEY,
  ENV_TRANSLATE_LLM_BASE_URL,
  ENV_TRANSLATE_LLM_MODEL,
  ENV_TRANSLATE_PROVIDER,
  type TranslatorEnv,
} from '../env.js';

function trimStr(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t === '' ? undefined : t;
}

function matchingProviderRow(
  translate: TranslateConfigInput | undefined,
  id: TranslationProviderId,
): TranslateProviderRowInput | undefined {
  if (!translate) return undefined;
  return translate.providers?.find((p) => p.id === id && p.enabled !== false);
}

function parseProviderLabel(raw: string): TranslationProviderId {
  const id = raw.trim().toLowerCase();
  if (!isTranslationProviderId(id)) {
    const known = [...listTranslationProviders().map((d) => d.id)].sort().join(', ');
    throw new I18nPruneError(`Unknown translation provider "${raw}". Supported: ${known}`, 'USAGE', {
      issueCode: ISSUE_TRANSLATE_UNKNOWN_TRANSLATION_PROVIDER,
    });
  }
  return id;
}

function configTranslateId(config: TranslateConfigInput | undefined): TranslationProviderId | undefined {
  const id = config?.primary;
  if (!id || !isTranslationProviderId(id)) return undefined;
  return id;
}

/**
 * Effective backend id (**precedence**): `pin` (CLI **`--provider`**) → **`I18NPRUNE_TRANSLATE_PROVIDER`** →
 * **`translate.primary`** → core default.
 */
export function effectiveTranslationProviderId(input: {
  config: TranslateConfigInput | undefined;
  pin?: string;
  env: TranslatorEnv;
}): TranslationProviderId {
  const fromPin = trimStr(input.pin);
  if (fromPin) return parseProviderLabel(fromPin);
  const fromEnv = trimStr(input.env[ENV_TRANSLATE_PROVIDER]);
  if (fromEnv) return parseProviderLabel(fromEnv);
  const fromFile = configTranslateId(input.config);
  if (fromFile !== undefined) return fromFile;
  return defaultResolvedTranslationOptions().provider;
}

/**
 * Ordered provider ids for this run.
 *
 * - **`routing: 'single'`** (or unset): one effective id — from **`pin`**, env, then **`translate.primary`**.
 * - **`routing: 'auto'`**: primary (or **`pin`** / env **first**) then remaining **enabled**
 *   **`translate.providers`** rows (deduped). A pin does **not** disable fallback; it only chooses which
 *   backend is tried first.
 */
export function resolveTranslationProviderOrder(input: {
  config: TranslateConfigInput | undefined;
  pin?: string;
  env: TranslatorEnv;
}): TranslationProviderId[] {
  const fromPin = trimStr(input.pin);
  const fromEnv = trimStr(input.env[ENV_TRANSLATE_PROVIDER]);
  const translate = input.config;
  const primary = effectiveTranslationProviderId({ config: translate, env: input.env });

  const appendEnabledRowsAfter = (head: TranslationProviderId[]): TranslationProviderId[] => {
    const ordered = [...head];
    for (const row of translate?.providers ?? []) {
      if (row.enabled === false) continue;
      if (!ordered.includes(row.id)) ordered.push(row.id);
    }
    return ordered;
  };

  if (translate?.policy?.routing === 'auto') {
    if (fromPin) return appendEnabledRowsAfter([parseProviderLabel(fromPin)]);
    if (fromEnv) return appendEnabledRowsAfter([parseProviderLabel(fromEnv)]);
  }

  if (fromPin) return [parseProviderLabel(fromPin)];
  if (fromEnv) return [parseProviderLabel(fromEnv)];

  if (!translate || translate.policy?.routing !== 'auto') return [primary];

  return appendEnabledRowsAfter([primary]);
}

/**
 * Merge config + env into options consumed by **`resolveTranslator()`**.
 *
 * Credential fields (**per key**): if an env variable is non-empty it **wins**; otherwise values from the
 * matching **`translate.providers`** row apply **only when** that row's **`id`** matches the effective backend.
 */
export function resolveTranslationProviderOptions(input: {
  config: TranslateConfigInput | undefined;
  pin?: string;
  env: TranslatorEnv;
}): ResolvedTranslationProviderOptions {
  const id = resolveTranslationProviderOrder(input)[0]!;
  return resolveTranslationProviderOptionsForId({
    config: input.config,
    id,
    env: input.env,
  });
}

export function resolveTranslationProviderOptionsForId(input: {
  config: TranslateConfigInput | undefined;
  id: TranslationProviderId;
  env: TranslatorEnv;
}): ResolvedTranslationProviderOptions {
  const { config, id, env } = input;
  const fileMatch = config !== undefined ? matchingProviderRow(config, id) : undefined;

  let out: ResolvedTranslationProviderOptions;
  switch (id) {
    case 'google':
      out = { provider: 'google' };
      break;
    case 'mymemory': {
      const contactEmail =
        fileMatch?.id === 'mymemory' ? trimStr(fileMatch.contactEmail) : undefined;
      out = { provider: 'mymemory', ...(contactEmail !== undefined ? { contactEmail } : {}) };
      break;
    }
    case 'libre': {
      const baseUrlFile = fileMatch?.id === 'libre' ? trimStr(fileMatch.baseUrl) : undefined;
      const baseUrl = trimStr(env[ENV_TRANSLATE_LIBRE_URL]) ?? baseUrlFile;
      out = { provider: 'libre', ...(baseUrl !== undefined ? { baseUrl } : {}) };
      break;
    }
    case 'deepl': {
      const fileKey = fileMatch?.id === 'deepl' ? trimStr(fileMatch.apiKey) : undefined;
      const apiKey = trimStr(env[ENV_TRANSLATE_DEEPL_API_KEY]) ?? fileKey;
      out = { provider: 'deepl', ...(apiKey !== undefined ? { apiKey } : {}) };
      break;
    }
    case 'llm': {
      const L = fileMatch?.id === 'llm' ? fileMatch : undefined;
      const apiKey = trimStr(env[ENV_TRANSLATE_LLM_API_KEY]) ?? trimStr(L?.apiKey);
      const baseUrl = trimStr(env[ENV_TRANSLATE_LLM_BASE_URL]) ?? trimStr(L?.baseUrl);
      const model = trimStr(env[ENV_TRANSLATE_LLM_MODEL]) ?? trimStr(L?.model);
      out = {
        provider: 'llm',
        ...(apiKey !== undefined ? { apiKey } : {}),
        ...(baseUrl !== undefined ? { baseUrl } : {}),
        ...(model !== undefined ? { model } : {}),
      };
      break;
    }
    default:
      throw new I18nPruneError(`Unknown translation provider: ${String(id)}`, 'USAGE', {
        issueCode: ISSUE_TRANSLATE_UNKNOWN_TRANSLATION_PROVIDER,
      });
  }

  validateResolvedTranslationOptions(out);
  return out;
}

/**
 * Fail fast when a keyed backend is selected but **`resolveTranslationProviderOptions`** did not receive
 * **`apiKey`** / **`baseUrl`** / **`model`** (after env merge).
 */
export function assertTranslationProviderCredentialsReady(opts: ResolvedTranslationProviderOptions): void {
  if (opts.provider === 'deepl' && trimStr(opts.apiKey) === undefined) {
    throw new I18nPruneError(
      'DeepL requires an API key: set apiKey on the translate.providers deepl row or I18NPRUNE_TRANSLATE_DEEPL_API_KEY.',
      'USAGE',
      { issueCode: ISSUE_TRANSLATE_MISSING_CREDENTIALS },
    );
  }
  if (opts.provider === 'libre' && trimStr(opts.baseUrl) === undefined) {
    throw new I18nPruneError(
      'LibreTranslate requires a base URL: set baseUrl on the translate.providers libre row or I18NPRUNE_TRANSLATE_LIBRE_URL.',
      'USAGE',
      { issueCode: ISSUE_TRANSLATE_MISSING_CREDENTIALS },
    );
  }
  if (opts.provider === 'llm') {
    const missing: string[] = [];
    if (trimStr(opts.apiKey) === undefined) missing.push('apiKey');
    if (trimStr(opts.baseUrl) === undefined) missing.push('baseUrl');
    if (trimStr(opts.model) === undefined) missing.push('model');
    if (missing.length > 0) {
      throw new I18nPruneError(
        `LLM provider requires ${missing.join(', ')}: set fields on the translate.providers llm row or I18NPRUNE_TRANSLATE_LLM_* env vars.`,
        'USAGE',
        { issueCode: ISSUE_TRANSLATE_MISSING_CREDENTIALS },
      );
    }
  }
}

/**
 * Validate a bare provider label (no file config / credential merge). Hosts / SDK consumers can use
 * this when they only have a CLI flag and want a typed **`ResolvedTranslationProviderOptions`** (no
 * credentials).
 */
export function resolvedTranslationOptionsFromCliFlag(
  providerFlag: string | undefined,
): ResolvedTranslationProviderOptions {
  const raw = trimStr(providerFlag) ?? defaultResolvedTranslationOptions().provider;
  switch (parseProviderLabel(raw)) {
    case 'google':
      return { provider: 'google' };
    case 'mymemory':
      return { provider: 'mymemory' };
    case 'libre':
      return { provider: 'libre' };
    case 'deepl':
      return { provider: 'deepl' };
    case 'llm':
      return { provider: 'llm' };
    default:
      throw new I18nPruneError(`Unknown translation provider "${raw}".`, 'USAGE', {
        issueCode: ISSUE_TRANSLATE_UNKNOWN_TRANSLATION_PROVIDER,
      });
  }
}
