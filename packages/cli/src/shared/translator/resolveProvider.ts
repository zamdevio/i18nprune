import type { Context } from '@/types/core/context/index.js';
import {
  assertTranslationProviderCredentialsReady,
  effectiveTranslationProviderId as effectiveCoreTranslationProviderId,
  resolvedTranslationOptionsFromCliFlag,
  resolveTranslationProviderOptions as resolveCoreTranslationProviderOptions,
  resolveTranslationProviderOptionsForId as resolveCoreTranslationProviderOptionsForId,
  resolveTranslationProviderOrder as resolveCoreTranslationProviderOrder,
  translationRunMeta,
  type ResolvedTranslationProviderOptions,
  type TranslationProviderId,
} from '@i18nprune/core';

/**
 * Effective backend id (**precedence**): `--provider` -> `I18NPRUNE_TRANSLATE_PROVIDER` ->
 * `translate.primary` -> core default.
 */
export function effectiveTranslationProviderId(
  ctx: Context,
  cliProvider: string | undefined,
): TranslationProviderId {
  return effectiveCoreTranslationProviderId({
    config: ctx.config.translate,
    pin: cliProvider,
    env: process.env,
  });
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
  return resolveCoreTranslationProviderOrder({
    config: ctx.config.translate,
    pin: cliProvider,
    env: process.env,
  });
}

/**
 * Merge config + env into options consumed by **`resolveTranslator()`** (`@i18nprune/core`).
 *
 * Credential fields (**per key**): if an env variable is non-empty it **wins**; otherwise values from the matching
 * **`translate.providers`** row apply **only when** that row's **`id`** matches the effective backend.
 */
export function resolveTranslationProviderOptions(
  ctx: Context,
  cliProvider: string | undefined,
): ResolvedTranslationProviderOptions {
  return resolveCoreTranslationProviderOptions({
    config: ctx.config.translate,
    pin: cliProvider,
    env: process.env,
  });
}

export function resolveTranslationProviderOptionsForId(
  ctx: Context,
  id: TranslationProviderId,
): ResolvedTranslationProviderOptions {
  return resolveCoreTranslationProviderOptionsForId({
    config: ctx.config.translate,
    id,
    env: process.env,
  });
}

export { assertTranslationProviderCredentialsReady, resolvedTranslationOptionsFromCliFlag };

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
