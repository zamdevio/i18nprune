/**
 * Translate handoff catalogue — built-in provider pool (**not** `translate.providers[]` order).
 * Step 7 of `translate-policy (shipped)`: eligibility ordering and credential synthesis
 * for mid-run picks; CLI / hosts render the picker UI separately.
 */

import type { TranslatorEnv } from '../../shared/constants/translate.js';
import {
  ENV_TRANSLATE_DEEPL_API_KEY,
  ENV_TRANSLATE_LIBRE_URL,
  ENV_TRANSLATE_LLM_API_KEY,
  ENV_TRANSLATE_LLM_BASE_URL,
  ENV_TRANSLATE_LLM_MODEL,
} from '../../shared/constants/translate.js';
import type { TranslateConfigInput } from '../../types/config/index.js';
import type { ResolvedTranslationProviderOptions, TranslationProviderId } from '../../types/translator/providers.js';
import { resolveTranslationProviderOptionsForId } from '../providers/options.js';

function trimStr(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t === '' ? undefined : t;
}

/** Public LibreTranslate demo instance used when catalog handoff picks `libre` with no URL in env/file. */
export const HANDOFF_PUBLIC_LIBRE_TRANSLATE_ORIGIN = 'https://libretranslate.com';

/**
 * Built-in provider ids in UI order: **`google`** first (recommended when eligible), then the rest
 * (matches the shipped registry order with **`google`** pinned ahead for discoverability).
 */
export const HANDOFF_PROVIDER_ORDER: readonly TranslationProviderId[] = [
  'google',
  'mymemory',
  'libre',
  'deepl',
  'llm',
];

/** Whether interactive handoff UX may run (`translate-policy (shipped)` §8 matrix). */
export function shouldOfferHandoffInteractivePrompt(params: {
  readonly routing: 'single' | 'auto';
  readonly handoff: 'auto' | 'on' | 'off';
  readonly isTty: boolean;
}): boolean {
  if (params.handoff === 'off') return false;
  if (params.handoff === 'on') return params.isTty;
  // handoff === 'auto'
  if (params.routing === 'auto') return false;
  return params.isTty;
}

/** `single · on · non-TTY` → caller should warn once then abort (`translate-policy (shipped)` §8). */
export function shouldWarnAndAbortHandoffOnNonTty(params: {
  readonly routing: 'single' | 'auto';
  readonly handoff: 'auto' | 'on' | 'off';
  readonly isTty: boolean;
}): boolean {
  return params.routing === 'single' && params.handoff === 'on' && !params.isTty;
}

export type HandoffEligibilityRow = {
  readonly id: TranslationProviderId;
  /** True only when this row is first in the eligible list and is `google`. */
  readonly recommended: boolean;
};

export type HandoffCatalogBuildResult = {
  readonly eligibleRows: readonly HandoffEligibilityRow[];
  /** Human-readable reason per provider id filtered out (for empty-pool messages). */
  readonly ineligibleReasons: Readonly<Record<string, string>>;
};

function deeplEligible(env: TranslatorEnv, config: TranslateConfigInput | undefined): boolean {
  const fileMatch = config?.providers?.find((p) => p.id === 'deepl' && p.enabled !== false);
  const apiKey =
    trimStr(env[ENV_TRANSLATE_DEEPL_API_KEY]) ?? (fileMatch?.id === 'deepl' ? trimStr(fileMatch.apiKey) : undefined);
  return apiKey !== undefined;
}

function llmEligible(env: TranslatorEnv, config: TranslateConfigInput | undefined): boolean {
  const L = config?.providers?.find((p) => p.id === 'llm' && p.enabled !== false);
  const apiKey = trimStr(env[ENV_TRANSLATE_LLM_API_KEY]) ?? trimStr(L?.id === 'llm' ? L.apiKey : undefined);
  const baseUrl = trimStr(env[ENV_TRANSLATE_LLM_BASE_URL]) ?? trimStr(L?.id === 'llm' ? L.baseUrl : undefined);
  const model = trimStr(env[ENV_TRANSLATE_LLM_MODEL]) ?? trimStr(L?.id === 'llm' ? L.model : undefined);
  return apiKey !== undefined && baseUrl !== undefined && model !== undefined;
}

export function explainHandoffIneligibility(
  id: TranslationProviderId,
  env: TranslatorEnv,
  config: TranslateConfigInput | undefined,
): string | undefined {
  switch (id) {
    case 'google':
    case 'mymemory':
      return undefined;
    case 'libre':
      return undefined;
    case 'deepl':
      return deeplEligible(env, config) ? undefined : 'deepl skipped: missing apiKey (translate.providers deepl.apiKey or I18NPRUNE_TRANSLATE_DEEPL_API_KEY)';
    case 'llm':
      return llmEligible(env, config)
        ? undefined
        : 'llm skipped: need apiKey, baseUrl, and model (providers row + I18NPRUNE_TRANSLATE_LLM_* env)';
    default: {
      const _e: never = id;
      return `unknown catalog id ${_e}`;
    }
  }
}

/**
 * Built-in catalogue providers eligible for handoff after excluding the failing backend.
 *
 * Ordering: **`google`** first when eligible (**recommended** marker only then); otherwise follows
 * {@link HANDOFF_PROVIDER_ORDER}.
 */
export function buildHandoffCatalogEligible(
  failingProviderId: TranslationProviderId,
  env: TranslatorEnv,
  config: TranslateConfigInput | undefined,
): HandoffCatalogBuildResult {
  const ineligibleReasons: Record<string, string> = {};
  const eligible: TranslationProviderId[] = [];
  for (const id of HANDOFF_PROVIDER_ORDER) {
    if (id === failingProviderId) continue;
    const reason = explainHandoffIneligibility(id, env, config);
    if (reason !== undefined) {
      ineligibleReasons[id] = reason;
      continue;
    }
    eligible.push(id);
  }
  const eligibleRows: HandoffEligibilityRow[] = eligible.map((id, i) => ({
    id,
    recommended: i === 0 && id === 'google',
  }));
  return { eligibleRows, ineligibleReasons };
}

/** Merge env + optional config row like {@link resolveTranslationProviderOptionsForId}; add public Libre fallback for handoff. */
export function synthesizeHandoffTranslationOptions(input: {
  readonly config: TranslateConfigInput | undefined;
  readonly env: TranslatorEnv;
  readonly id: TranslationProviderId;
}): ResolvedTranslationProviderOptions {
  const o = resolveTranslationProviderOptionsForId(input);
  if (o.provider === 'libre' && trimStr(o.baseUrl) === undefined) {
    const fromEnv = trimStr(input.env[ENV_TRANSLATE_LIBRE_URL]);
    return { ...o, baseUrl: fromEnv ?? HANDOFF_PUBLIC_LIBRE_TRANSLATE_ORIGIN };
  }
  return o;
}

/**
 * Ensure **`pick`** is tried immediately after the failing id at **`pi`**.
 * Removes any other **`pick`** occurrences in the chain, then inserts **`pick`** at **`failingIndex + 1`**.
 */
export function prioritizeProviderAfter(
  chain: TranslationProviderId[],
  pi: number,
  pick: TranslationProviderId,
): void {
  const failingId = chain[pi];
  if (failingId === undefined) {
    throw new Error('prioritizeProviderAfter: chain[pi] is undefined');
  }
  if (pick === failingId) {
    throw new Error('prioritizeProviderAfter: pick must not equal the failing provider at pi');
  }
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    if (chain[i] === pick && i !== pi) chain.splice(i, 1);
  }
  const newPi = chain.indexOf(failingId);
  if (newPi === -1) {
    throw new Error('prioritizeProviderAfter: failing provider missing after dedupe');
  }
  if (chain[newPi + 1] === pick) return;
  chain.splice(newPi + 1, 0, pick);
}
