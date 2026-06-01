import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '@i18nprune/core/config';
import {
  ENV_I18NPRUNE_TRANSLATE_LLM_API_KEY,
  ENV_I18NPRUNE_TRANSLATE_LLM_MODEL,
  ENV_I18NPRUNE_TRANSLATE_PROVIDER,
} from '@/constants/env.js';
import type { Context } from '@/types/core/context/index.js';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import {
  assertTranslationProviderCredentialsReady,
  I18nPruneError,
  ISSUE_TRANSLATE_MISSING_CREDENTIALS,
  ISSUE_TRANSLATE_UNKNOWN_TRANSLATION_PROVIDER,
  resolvedTranslationOptionsFromCliFlag,
} from '@i18nprune/core';
import {
  effectiveTranslationProviderId,
  resolveTranslationProviderOrder,
  resolveTranslationProviderOptions,
  safeTranslationMetaForEnvelope,
} from '../resolveProvider.js';

const ENV_TOUCH = [
  ENV_I18NPRUNE_TRANSLATE_PROVIDER,
  ENV_I18NPRUNE_TRANSLATE_LLM_API_KEY,
  ENV_I18NPRUNE_TRANSLATE_LLM_MODEL,
] as const;

function makeContext(overrides?: Partial<I18nPruneConfig>): Context {
  const config = parseI18nPruneConfig({ ...DEFAULT_CONFIG, ...overrides }) as I18nPruneConfig;
  return {
    config,
    paths: {
      sourceLocale: '/tmp/en.json',
      localesDir: '/tmp/locales',
      srcRoot: '/tmp/src',
    },
    run: { json: false, jsonPretty: true, quiet: false, silent: false, debugScan: false, debugCache: false },
    meta: {
      fieldSources: {},
      configFileLoaded: true,
      warnings: [],
      cache: {
        enabled: false,
        reason: 'default',
        rootDir: '',
        metaPath: '',
        projectId: '',
        projectRoot: '/tmp',
        projectDir: '',
        filesPath: '',
        analysisPath: '',
        translationsDir: '',
        readOnly: false,
      },
    },
    adapters: createNodeRuntimeAdapters(),
  };
}

describe('translator env snapshots', () => {
  const saved: Partial<Record<(typeof ENV_TOUCH)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const k of ENV_TOUCH) {
      saved[k] = process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ENV_TOUCH) {
      const v = saved[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  describe('resolvedTranslationOptionsFromCliFlag', () => {
    it('defaults to google', () => {
      expect(resolvedTranslationOptionsFromCliFlag(undefined)).toEqual({ provider: 'google' });
    });

    it('accepts provider ids case-insensitively', () => {
      expect(resolvedTranslationOptionsFromCliFlag('DEEPL')).toEqual({ provider: 'deepl' });
    });

    it('rejects unknown providers with issueCode', () => {
      expect(() => resolvedTranslationOptionsFromCliFlag('zap')).toThrow(I18nPruneError);
      try {
        resolvedTranslationOptionsFromCliFlag('zap');
      } catch (e) {
        expect((e as I18nPruneError).issueCode).toBe(ISSUE_TRANSLATE_UNKNOWN_TRANSLATION_PROVIDER);
      }
    });
  });

  describe('resolveTranslationProviderOptions', () => {
    it('uses primary first when routing is auto', () => {
      delete process.env[ENV_I18NPRUNE_TRANSLATE_PROVIDER];
      const ctx = makeContext({
        translate: {
          primary: 'mymemory',
          providers: [{ id: 'google' }, { id: 'mymemory' }, { id: 'llm' }],
          policy: { routing: 'auto' },
        },
      });
      expect(resolveTranslationProviderOptions(ctx, undefined)).toEqual({ provider: 'mymemory' });
    });

    it('reads translate.primary when flag and provider env omit', () => {
      delete process.env[ENV_I18NPRUNE_TRANSLATE_PROVIDER];
      const ctx = makeContext({
        translate: {
          primary: 'mymemory',
          providers: [{ id: 'google' }, { id: 'mymemory' }],
        },
      });
      expect(resolveTranslationProviderOptions(ctx, undefined)).toEqual({ provider: 'mymemory' });
    });

    it('merges contactEmail for mymemory from matching providers row', () => {
      delete process.env[ENV_I18NPRUNE_TRANSLATE_PROVIDER];
      const ctx = makeContext({
        translate: {
          primary: 'mymemory',
          providers: [{ id: 'google' }, { id: 'mymemory', contactEmail: '  hi@example.com ' }],
        },
      });
      expect(resolveTranslationProviderOptions(ctx, undefined)).toEqual({
        provider: 'mymemory',
        contactEmail: 'hi@example.com',
      });
    });

    it('prefers I18NPRUNE_TRANSLATE_PROVIDER over config translate.primary', () => {
      process.env[ENV_I18NPRUNE_TRANSLATE_PROVIDER] = 'deepl';
      const ctx = makeContext({
        translate: {
          primary: 'google',
          providers: [{ id: 'google' }, { id: 'deepl' }],
        },
      });
      expect(effectiveTranslationProviderId(ctx, undefined)).toBe('deepl');
    });

    it('prefers --provider flag over env and config', () => {
      process.env[ENV_I18NPRUNE_TRANSLATE_PROVIDER] = 'deepl';
      const ctx = makeContext({
        translate: {
          primary: 'google',
          providers: [{ id: 'google' }, { id: 'deepl' }, { id: 'llm' }],
        },
      });
      expect(resolveTranslationProviderOptions(ctx, '  LLM')).toMatchObject({
        provider: 'llm',
      });
    });

    it('merges I18NPRUNE_TRANSLATE_LLM_API_KEY for llm apiKey', () => {
      delete process.env[ENV_I18NPRUNE_TRANSLATE_PROVIDER];
      process.env[ENV_I18NPRUNE_TRANSLATE_LLM_API_KEY] = 'token-from-env';
      const ctx = makeContext({
        translate: {
          primary: 'llm',
          providers: [{ id: 'google' }, { id: 'llm' }],
        },
      });
      expect(resolveTranslationProviderOptions(ctx, undefined)).toMatchObject({
        provider: 'llm',
        apiKey: 'token-from-env',
      });
    });

    it('prefers I18NPRUNE_TRANSLATE_LLM_MODEL over translate.providers llm row model', () => {
      delete process.env[ENV_I18NPRUNE_TRANSLATE_PROVIDER];
      process.env[ENV_I18NPRUNE_TRANSLATE_LLM_MODEL] = 'from-env';
      const ctx = makeContext({
        translate: {
          primary: 'llm',
          providers: [{ id: 'google' }, { id: 'llm', model: 'from-config' }],
        },
      });
      expect(resolveTranslationProviderOptions(ctx, undefined)).toMatchObject({
        provider: 'llm',
        model: 'from-env',
      });
    });
  });

  describe('resolveTranslationProviderOrder', () => {
    it('returns primary then other enabled providers for auto routing', () => {
      const ctx = makeContext({
        translate: {
          primary: 'mymemory',
          providers: [{ id: 'google' }, { id: 'mymemory' }, { id: 'llm', enabled: false }, { id: 'deepl' }],
          policy: { routing: 'auto' },
        },
      });
      expect(resolveTranslationProviderOrder(ctx, undefined)).toEqual(['mymemory', 'google', 'deepl']);
    });

    it('with auto routing, --provider is first in the chain; other enabled rows are fallbacks', () => {
      const ctx = makeContext({
        translate: {
          primary: 'google',
          providers: [{ id: 'google' }, { id: 'mymemory' }, { id: 'deepl' }],
          policy: { routing: 'auto' },
        },
      });
      expect(resolveTranslationProviderOrder(ctx, 'deepl')).toEqual(['deepl', 'google', 'mymemory']);
    });
  });

  describe('assertTranslationProviderCredentialsReady', () => {
    it('throws missing_credentials when deepl has no apiKey', () => {
      expect(() =>
        assertTranslationProviderCredentialsReady({ provider: 'deepl' }),
      ).toThrow(I18nPruneError);
      try {
        assertTranslationProviderCredentialsReady({ provider: 'deepl' });
      } catch (e) {
        expect(e).toBeInstanceOf(I18nPruneError);
        expect((e as I18nPruneError).issueCode).toBe(ISSUE_TRANSLATE_MISSING_CREDENTIALS);
      }
    });

    it('throws when llm is missing required fields', () => {
      expect(() =>
        assertTranslationProviderCredentialsReady({
          provider: 'llm',
          apiKey: 'k',
        }),
      ).toThrow(I18nPruneError);
    });

    it('throws missing_credentials when libre has no baseUrl', () => {
      expect(() => assertTranslationProviderCredentialsReady({ provider: 'libre' })).toThrow(I18nPruneError);
      try {
        assertTranslationProviderCredentialsReady({ provider: 'libre' });
      } catch (e) {
        expect((e as I18nPruneError).issueCode).toBe(ISSUE_TRANSLATE_MISSING_CREDENTIALS);
      }
    });
  });

  describe('safeTranslationMetaForEnvelope', () => {
    it('includes providerId for known resolution', () => {
      const ctx = makeContext();
      expect(safeTranslationMetaForEnvelope(ctx, undefined)).toMatchObject({ providerId: 'google' });
    });

    it('returns empty object for invalid provider label on flag', () => {
      const ctx = makeContext();
      expect(safeTranslationMetaForEnvelope(ctx, 'zap')).toEqual({});
    });
  });
});

