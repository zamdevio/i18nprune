import type { TranslationProviderDescriptor, TranslationProviderId } from '../../../types/translator/providers.js';
import { listTranslationProviders } from '../providers/registry.js';

/** Human-readable merge rules (same semantics as CLI `resolveTranslationProviderOptions`). */
export const TRANSLATION_PROVIDER_CREDENTIAL_PRECEDENCE =
  'Backend id: CLI --provider → env I18NPRUNE_TRANSLATE_PROVIDER → config translate.primary → default (google). ' +
  'Per field: non-empty matching I18NPRUNE_TRANSLATE_* env overrides the same field on the translate.providers row when the resolved id matches that row.';

const CONFIG_SNIPPETS: Readonly<Record<TranslationProviderId, string>> = {
  google: `translate: { primary: 'google', providers: [{ id: 'google' }], policy: { routing: 'single' } }`,
  mymemory:
    `translate: { primary: 'mymemory', providers: [{ id: 'mymemory', contactEmail: 'you@example.com' }] }`,
  libre:
    `translate: { primary: 'libre', providers: [{ id: 'libre', baseUrl: 'https://libretranslate.com' }] }`,
  deepl:
    `translate: { primary: 'deepl', providers: [{ id: 'deepl' /* apiKey: '…' or env I18NPRUNE_TRANSLATE_DEEPL_API_KEY */ }] }`,
  llm: `translate: { primary: 'llm', providers: [{ id: 'llm', apiKey: '…', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' }] }`,
};

export type TranslationProvidersListPayload = {
  readonly providers: readonly TranslationProviderDescriptor[];
  readonly mergePrecedence: string;
  readonly configSnippets: Readonly<Record<TranslationProviderId, string>>;
};

/** Stable payload for **`i18nprune providers`** (`--json` and human views). */
export function buildTranslationProvidersPayload(): TranslationProvidersListPayload {
  return {
    providers: listTranslationProviders(),
    mergePrecedence: TRANSLATION_PROVIDER_CREDENTIAL_PRECEDENCE,
    configSnippets: CONFIG_SNIPPETS,
  };
}
