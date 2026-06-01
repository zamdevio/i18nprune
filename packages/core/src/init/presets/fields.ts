import type { InitPresetConfigFields, InitPresetId } from '../../types/init/index.js';

/**
 * Every shipped starter preset id (for validation, scoring order, and CLI prompts).
 *
 * @remarks **`generic` first** (neutral default); remaining ids are alphabetical for stable UX.
 */
export const INIT_PRESET_IDS: readonly InitPresetId[] = [
  'generic',
  'i18next',
  'lingui',
  'next-i18next',
  'next-intl',
  'react-intl',
] as const;

export function isInitPresetId(value: string): value is InitPresetId {
  return (INIT_PRESET_IDS as readonly string[]).includes(value);
}

/** Comma-separated preset ids for machine / human hints (stable order). */
export function formatInitPresetIdList(): string {
  return INIT_PRESET_IDS.join(', ');
}

const PRESET_FIELDS: Record<InitPresetId, InitPresetConfigFields> = {
  generic: {
    locales: { source: 'en', directory: 'locales' },
    src: 'src',
    functions: ['t'],
  },
  'next-intl': {
    locales: { source: 'en', directory: 'messages' },
    src: 'src',
    functions: ['useTranslations', 't'],
  },
  'next-i18next': {
    locales: { source: 'en', directory: 'public/locales' },
    src: 'src',
    functions: ['useTranslation', 't'],
  },
  i18next: {
    locales: { source: 'en', directory: 'locales' },
    src: 'src',
    functions: ['t', 'i18n.t'],
  },
  lingui: {
    locales: { source: 'en', directory: 'locales' },
    src: 'src',
    functions: ['t', 'Trans'],
  },
  'react-intl': {
    locales: { source: 'en', directory: 'locales' },
    src: 'src',
    functions: ['useIntl', 'FormattedMessage'],
  },
};

/** Resolved starter fields for **`buildInitConfigTemplate`**. */
export function getInitPresetConfigFields(preset: InitPresetId): InitPresetConfigFields {
  return PRESET_FIELDS[preset];
}
