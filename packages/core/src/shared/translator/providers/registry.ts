import {
  ISSUE_TRANSLATE_MISSING_CREDENTIALS,
  ISSUE_TRANSLATE_UNKNOWN_TRANSLATION_PROVIDER,
} from '../../constants/issueCodes.js';
import { I18nPruneError } from '../../errors/index.js';
import type { Translator } from '../../../types/translator/index.js';
import type {
  ResolvedTranslationProviderOptions,
  TranslationProviderDescriptor,
  TranslationProviderId,
} from '../../../types/translator/providers.js';
import { createDeeplTranslator } from './deepl/index.js';
import { createGoogleTranslator } from './google/index.js';
import { createLibreTranslator } from './libre/index.js';
import { createLlmTranslator } from './llm/index.js';
import { createMymemoryTranslator } from './mymemory/index.js';

const GOOGLE_DESCRIPTOR: TranslationProviderDescriptor = {
  id: 'google',
  label: 'Google Translate (unofficial gtx endpoint)',
  kind: 'public_http',
  envVars: [],
};

const MYMEMORY_DESCRIPTOR: TranslationProviderDescriptor = {
  id: 'mymemory',
  label: 'MyMemory Translation API (free tier)',
  kind: 'public_http',
  envVars: [],
  configKeys: [
    {
      key: 'translate.providers row (id=mymemory).contactEmail',
      description: 'Optional MyMemory contact email',
      optional: true,
    },
  ],
};

const LIBRE_DESCRIPTOR: TranslationProviderDescriptor = {
  id: 'libre',
  label: 'LibreTranslate-compatible HTTP API',
  kind: 'public_http',
  envVars: [
    {
      key: 'I18NPRUNE_TRANSLATE_LIBRE_URL',
      description: 'LibreTranslate instance origin (https://…), no trailing slash',
      required: false,
    },
  ],
  configKeys: [
    {
      key: 'translate.providers row (id=libre).baseUrl',
      description: 'Instance origin (`https://…`); superseded when `I18NPRUNE_TRANSLATE_LIBRE_URL` is set',
      optional: true,
    },
  ],
};

const DEEPL_DESCRIPTOR: TranslationProviderDescriptor = {
  id: 'deepl',
  label: 'DeepL API',
  kind: 'api_key',
  envVars: [
    {
      key: 'I18NPRUNE_TRANSLATE_DEEPL_API_KEY',
      description: 'DeepL authentication key (preferred when using DeepL)',
      required: false,
    },
  ],
  configKeys: [
    {
      key: 'translate.providers row (id=deepl).apiKey',
      description: 'DeepL auth key — superseded by `I18NPRUNE_TRANSLATE_DEEPL_API_KEY` when set',
      optional: true,
    },
  ],
};

const LLM_DESCRIPTOR: TranslationProviderDescriptor = {
  id: 'llm',
  label: 'OpenAI-compatible chat/completions API (LLM)',
  kind: 'llm',
  envVars: [
    {
      key: 'I18NPRUNE_TRANSLATE_LLM_API_KEY',
      description: 'Bearer token for the OpenAI-compatible API',
      required: false,
    },
    {
      key: 'I18NPRUNE_TRANSLATE_LLM_BASE_URL',
      description: 'API base URL (e.g. https://api.openai.com/v1)',
      required: false,
    },
    {
      key: 'I18NPRUNE_TRANSLATE_LLM_MODEL',
      description: 'Model id (e.g. gpt-4o-mini)',
      required: false,
    },
  ],
  configKeys: [
    {
      key: 'translate.providers row (id=llm): apiKey, baseUrl, model',
      description: 'OpenAI-compatible host; env `I18NPRUNE_TRANSLATE_LLM_*` supersede matching fields',
      optional: true,
    },
  ],
};

const DESCRIPTORS: readonly TranslationProviderDescriptor[] = [
  GOOGLE_DESCRIPTOR,
  MYMEMORY_DESCRIPTOR,
  LIBRE_DESCRIPTOR,
  DEEPL_DESCRIPTOR,
  LLM_DESCRIPTOR,
];

const DESCRIPTOR_BY_ID = new Map<TranslationProviderId, TranslationProviderDescriptor>(
  DESCRIPTORS.map((d) => [d.id, d]),
);

/** Stable list for CLI help, doctor, and integrations. */
export function listTranslationProviders(): readonly TranslationProviderDescriptor[] {
  return DESCRIPTORS;
}

export function isTranslationProviderId(value: string): value is TranslationProviderId {
  return DESCRIPTOR_BY_ID.has(value as TranslationProviderId);
}

export function defaultResolvedTranslationOptions(): ResolvedTranslationProviderOptions {
  return { provider: 'google' };
}

/** Validate options shape before building a {@link Translator}. */
export function validateResolvedTranslationOptions(opts: ResolvedTranslationProviderOptions): void {
  if (!DESCRIPTOR_BY_ID.has(opts.provider)) {
    throw new I18nPruneError(`Unknown translation provider: ${String((opts as { provider: string }).provider)}`, 'USAGE', {
      issueCode: ISSUE_TRANSLATE_UNKNOWN_TRANSLATION_PROVIDER,
    });
  }
}

/**
 * Non-secret fields for **`run.progress.*`** / logs (never API keys).
 * Extend when adding **`ai`** (e.g. attach **`translationModel`** from resolved options).
 */
export function translationRunMeta(
  resolved: ResolvedTranslationProviderOptions,
): { providerId: TranslationProviderId; translationModel?: string } {
  if (resolved.provider === 'llm' && resolved.model) {
    return { providerId: resolved.provider, translationModel: resolved.model };
  }
  return { providerId: resolved.provider };
}

function trimStr(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t === '' ? undefined : t;
}

/** Build a {@link Translator} from host-resolved options (secrets already injected by client when needed). */
export function resolveTranslator(opts: ResolvedTranslationProviderOptions): Translator {
  validateResolvedTranslationOptions(opts);
  switch (opts.provider) {
    case 'google':
      return createGoogleTranslator();
    case 'mymemory':
      return createMymemoryTranslator({ contactEmail: opts.contactEmail });
    case 'deepl': {
      const apiKey = trimStr(opts.apiKey);
      if (apiKey === undefined) {
        throw new I18nPruneError(
          'DeepL requires an API key before building a translator.',
          'USAGE',
          { issueCode: ISSUE_TRANSLATE_MISSING_CREDENTIALS },
        );
      }
      return createDeeplTranslator({ apiKey });
    }
    case 'libre': {
      const baseUrl = trimStr(opts.baseUrl);
      if (baseUrl === undefined) {
        throw new I18nPruneError(
          'LibreTranslate requires a baseUrl (instance origin) before building a translator.',
          'USAGE',
          { issueCode: ISSUE_TRANSLATE_MISSING_CREDENTIALS },
        );
      }
      return createLibreTranslator({ baseUrl });
    }
    case 'llm': {
      const apiKey = trimStr(opts.apiKey);
      const baseUrl = trimStr(opts.baseUrl);
      const model = trimStr(opts.model);
      if (apiKey === undefined || baseUrl === undefined || model === undefined) {
        throw new I18nPruneError(
          'LLM provider requires apiKey, baseUrl, and model before building a translator.',
          'USAGE',
          { issueCode: ISSUE_TRANSLATE_MISSING_CREDENTIALS },
        );
      }
      return createLlmTranslator({ apiKey, baseUrl, model });
    }
  }
}
