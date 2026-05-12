import type { DynamicKeySite } from '@i18nprune/core';

export type LocalesEditJsonRow = {
  target: string;
  profileSource: 'meta' | 'catalog';
  before: { englishName: string; nativeName: string; direction: 'ltr' | 'rtl' };
  after: { englishName: string; nativeName: string; direction: 'ltr' | 'rtl' };
  metaPath: string;
};

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

export type LocalesEditJsonPayload = {
  kind: 'locales-edit';
  target: string | null;
  targets: string[];
  skippedTargets: string[];
  updated: number;
  mode: 'meta_updated';
  profileSource: 'meta' | 'catalog';
  before: { englishName: string; nativeName: string; direction: 'ltr' | 'rtl' } | null;
  after: { englishName: string; nativeName: string; direction: 'ltr' | 'rtl' } | null;
  metaPath: string | null;
  rows: LocalesEditJsonRow[];
  supportsAutoPatching: true;
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
  deletedMeta: number;
  aborted: boolean;
  supportsAutoPatching: false;
};
