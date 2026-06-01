import type { I18nPruneConfigParsed } from '../schema/root.js';
import type { ReferenceCommandOverrides } from '../../types/reference/index.js';

/** Baseline reference policy copied into defaults and per-command overrides. */
export const REFERENCE_POLICY_SAFE_DEFAULTS: ReferenceCommandOverrides = {
  treatCommentedCallSitesAsRuntime: false,
  treatNonSourceFileSitesAsRuntime: false,
  uncertainKeyPolicy: 'protect',
  stringPresence: 'guard',
  stringPresenceMaxHitsPerKey: 5,
  respectPreserve: true,
};

/** Canonical app config defaults (shared by all hosts). */
export const DEFAULT_CONFIG: I18nPruneConfigParsed = {
  locales: {
    source: 'en',
    directory: 'locales',
  },
  src: 'src',
  functions: ['t'],
  exclude: { useDefaultSkip: true },
  output: {
    list: {},
  },
  cache: {
    enabled: true,
    mode: 'readWrite',
  },
  policies: {},
  reference: {
    defaults: { ...REFERENCE_POLICY_SAFE_DEFAULTS },
    commands: {
      cleanup: { ...REFERENCE_POLICY_SAFE_DEFAULTS },
      sync: { ...REFERENCE_POLICY_SAFE_DEFAULTS },
      generate: { ...REFERENCE_POLICY_SAFE_DEFAULTS },
    },
  },
  localeLeaves: {
    mode: 'legacy_string',
    sync: {
      stripMetadata: false,
    },
  },
  missing: {},
};
