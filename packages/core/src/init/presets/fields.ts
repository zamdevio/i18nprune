import type { InitPresetId } from '../../types/init/index.js';

/** Curated **`source` / `localesDir` / `src` / `functions`** defaults per preset. */
export type InitPresetConfigFields = {
  source: string;
  localesDir: string;
  src: string;
  functions: string[];
};

/**
 * Every shipped starter preset id (for validation, scoring order, and CLI prompts).
 *
 * @remarks **`generic` first** (neutral default); remaining ids are alphabetical for stable UX.
 */
export const INIT_PRESET_ORDER: readonly InitPresetId[] = [
  'generic',
  'i18next',
  'lingui',
  'next-i18next',
  'next-intl',
  'react-intl',
] as const;

/** Same sequence as {@link INIT_PRESET_ORDER} (compat alias). */
export const INIT_PRESET_IDS: readonly InitPresetId[] = INIT_PRESET_ORDER;

export function isInitPresetId(value: string): value is InitPresetId {
  return (INIT_PRESET_ORDER as readonly string[]).includes(value);
}

/** Comma-separated preset ids for machine / human hints (stable order). */
export function formatInitPresetIdList(): string {
  return INIT_PRESET_ORDER.join(', ');
}

const PRESET_FIELDS: Record<InitPresetId, InitPresetConfigFields> = {
  generic: {
    source: 'locales/en.json',
    localesDir: 'locales',
    src: 'src',
    functions: ['t'],
  },
  'next-intl': {
    source: 'messages/en.json',
    localesDir: 'messages',
    src: 'src',
    functions: ['useTranslations', 't'],
  },
  'next-i18next': {
    source: 'public/locales/en.json',
    localesDir: 'public/locales',
    src: 'src',
    functions: ['useTranslation', 't'],
  },
  i18next: {
    source: 'locales/en.json',
    localesDir: 'locales',
    src: 'src',
    functions: ['t', 'i18n.t'],
  },
  lingui: {
    source: 'locales/en.json',
    localesDir: 'locales',
    src: 'src',
    functions: ['t', 'Trans'],
  },
  'react-intl': {
    source: 'locales/en.json',
    localesDir: 'locales',
    src: 'src',
    functions: ['useIntl', 'FormattedMessage'],
  },
};

/** Resolved starter fields for **`buildInitConfigTemplate`**. */
export function getInitPresetConfigFields(preset: InitPresetId): InitPresetConfigFields {
  return PRESET_FIELDS[preset];
}
