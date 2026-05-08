import type { Context } from '@/types/core/context/index.js';
import type { TranslateProviderRow } from '@i18nprune/core/config';
import {
  ENV_I18NPRUNE_TRANSLATE_DEEPL_API_KEY,
  ENV_I18NPRUNE_TRANSLATE_LIBRE_URL,
  ENV_I18NPRUNE_TRANSLATE_LLM_API_KEY,
  ENV_I18NPRUNE_TRANSLATE_LLM_BASE_URL,
  ENV_I18NPRUNE_TRANSLATE_LLM_MODEL,
  ENV_I18NPRUNE_TRANSLATE_PROVIDER,
} from '@/constants/env.js';
import {
  defaultResolvedTranslationOptions,
  listTranslationProviders,
  isTranslationProviderId,
  I18nPruneError,
  ISSUE_TRANSLATE_MISSING_CREDENTIALS,
  ISSUE_TRANSLATE_UNKNOWN_TRANSLATION_PROVIDER,
  translationRunMeta,
  validateResolvedTranslationOptions,
  type ResolvedTranslationProviderOptions,
  type TranslationProviderId,
} from '@i18nprune/core';

function trimStr(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t === '' ? undefined : t;
}

function matchingProviderRow(
  translate: Context['config']['translate'],
  id: TranslationProviderId,
): TranslateProviderRow | undefined {
  if (!translate) return undefined;
  return translate.providers.find((p) => p.id === id && p.enabled !== false);
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

function configTranslateId(ctx: Context): TranslationProviderId | undefined {
  const id = ctx.config.translate?.primary;
  if (!id || !isTranslationProviderId(id)) return undefined;
  return id;
}

/**
 * Effective backend id (**precedence**): `--provider` → `I18NPRUNE_TRANSLATE_PROVIDER` →
 * `translate.primary` → core default.
 */
export function effectiveTranslationProviderId(
  ctx: Context,
  cliProvider: string | undefined,
): TranslationProviderId {
  const fromCli = trimStr(cliProvider);
  if (fromCli) return parseProviderLabel(fromCli);
  const fromEnv = trimStr(process.env[ENV_I18NPRUNE_TRANSLATE_PROVIDER]);
  if (fromEnv) return parseProviderLabel(fromEnv);
  const fromFile = configTranslateId(ctx);
  if (fromFile !== undefined) return fromFile;
  return defaultResolvedTranslationOptions().provider;
}

/**
 * Ordered provider ids for this run.
 *
 * - **`routing: 'single'`** (or unset): one effective id — from `--provider`, env, then `translate.primary`.
 * - **`routing: 'auto'`**: primary (or `--provider` / env **first**) then remaining **enabled** `translate.providers`
 *   rows (deduped). A CLI/env pin does **not** disable fallback; it only chooses which backend is tried first.
 */
export function resolveTranslationProviderOrder(
  ctx: Context,
  cliProvider: string | undefined,
): TranslationProviderId[] {
  const fromCli = trimStr(cliProvider);
  const fromEnv = trimStr(process.env[ENV_I18NPRUNE_TRANSLATE_PROVIDER]);
  const translate = ctx.config.translate;
  const primary = effectiveTranslationProviderId(ctx, undefined);

  const appendEnabledRowsAfter = (head: TranslationProviderId[]): TranslationProviderId[] => {
    const ordered = [...head];
    for (const row of translate?.providers ?? []) {
      if (row.enabled === false) continue;
      if (!ordered.includes(row.id)) ordered.push(row.id);
    }
    return ordered;
  };

  if (translate?.policy?.routing === 'auto') {
    if (fromCli) return appendEnabledRowsAfter([parseProviderLabel(fromCli)]);
    if (fromEnv) return appendEnabledRowsAfter([parseProviderLabel(fromEnv)]);
  }

  if (fromCli) return [parseProviderLabel(fromCli)];
  if (fromEnv) return [parseProviderLabel(fromEnv)];

  if (!translate || translate.policy?.routing !== 'auto') return [primary];

  return appendEnabledRowsAfter([primary]);
}

/**
 * Merge config + env into options consumed by **`resolveTranslator()`** (`@i18nprune/core`).
 *
 * Credential fields (**per key**): if an env variable is non-empty it **wins**; otherwise values from the matching
 * **`translate.providers`** row apply **only when** that row’s **`id`** matches the effective backend (after precedence above).
 */
export function resolveTranslationProviderOptions(
  ctx: Context,
  cliProvider: string | undefined,
): ResolvedTranslationProviderOptions {
  const id = resolveTranslationProviderOrder(ctx, cliProvider)[0]!;
  return resolveTranslationProviderOptionsForId(ctx, id);
}

export function resolveTranslationProviderOptionsForId(
  ctx: Context,
  id: TranslationProviderId,
): ResolvedTranslationProviderOptions {
  const translate = ctx.config.translate;
  const env = process.env;
  const fileMatch =
    translate !== undefined ? matchingProviderRow(translate, id) : undefined;

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
      const baseUrl =
        trimStr(env[ENV_I18NPRUNE_TRANSLATE_LIBRE_URL]) ?? baseUrlFile;
      out = { provider: 'libre', ...(baseUrl !== undefined ? { baseUrl } : {}) };
      break;
    }
    case 'deepl': {
      const fileKey = fileMatch?.id === 'deepl' ? trimStr(fileMatch.apiKey) : undefined;
      const apiKey = trimStr(env[ENV_I18NPRUNE_TRANSLATE_DEEPL_API_KEY]) ?? fileKey;
      out = { provider: 'deepl', ...(apiKey !== undefined ? { apiKey } : {}) };
      break;
    }
    case 'llm': {
      const L = fileMatch?.id === 'llm' ? fileMatch : undefined;
      const apiKey = trimStr(env[ENV_I18NPRUNE_TRANSLATE_LLM_API_KEY]) ?? trimStr(L?.apiKey);
      const baseUrl = trimStr(env[ENV_I18NPRUNE_TRANSLATE_LLM_BASE_URL]) ?? trimStr(L?.baseUrl);
      const model = trimStr(env[ENV_I18NPRUNE_TRANSLATE_LLM_MODEL]) ?? trimStr(L?.model);
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
 * Fail fast when a keyed backend is selected but **`resolveTranslationProviderOptions`** did not receive **`apiKey`** / **`baseUrl`** / **`model`** (after env merge).
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
 * Validate a bare provider label (no file config / credential merge).
 * Prefer {@link resolveTranslationProviderOptions} for CLI runs.
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

/** Non-secret metadata for envelopes / reports (same as core `translationRunMeta`). */
export function translationMetaForEnvelope(resolved: ResolvedTranslationProviderOptions): {
  providerId: TranslationProviderId;
  translationModel?: string;
} {
  return translationRunMeta(resolved);
}

/**
 * Like {@link translationMetaForEnvelope} after resolving with context; returns `{}` if resolution fails (invalid id).
 */
export function safeTranslationMetaForEnvelope(
  ctx: Context,
  cliProvider: string | undefined,
): { providerId?: TranslationProviderId; translationModel?: string } {
  try {
    const resolved = resolveTranslationProviderOptions(ctx, cliProvider);
    return translationMetaForEnvelope(resolved);
  } catch {
    return {};
  }
}
