import type { DynamicKeySite } from '@i18nprune/core';

export type LocalesListJsonRow = {
  code: string;
  localePath: string;
  leafCount: number;
  englishIdenticalLeafCount: number | null;
  isSourceLocale: boolean;
};

export type LocalesListJsonPayload = {
  kind: 'locales-list';
  sourceLocaleCode: string;
  sourceLocalePath: string;
  localesDir: string;
  localeCount: number;
  targetLocaleCount: number;
  rows: LocalesListJsonRow[];
};

export type LocalesDynamicJsonPayload = {
  kind: 'locales-dynamic';
  sourceLocalePath: string;
  sourceLocaleCode: string;
  top: number | null;
  full: boolean;
  shown: number;
  dynamic: {
    count: number;
    sites: DynamicKeySite[];
  };
};

export type LocalesDeleteJsonPayload = {
  kind: 'locales-delete';
  targets: string[];
  deletedJson: number;
  aborted: boolean;
  supportsAutoPatching: false;
};
