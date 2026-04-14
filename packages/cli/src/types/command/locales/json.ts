import type { DynamicKeySite } from '@/types/core/extractor/dynamic/index.js';

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
  mode: 'meta_updated';
  profileSource: 'meta' | 'catalog';
  before: { englishName: string; nativeName: string; direction: 'ltr' | 'rtl' } | null;
  after: { englishName: string; nativeName: string; direction: 'ltr' | 'rtl' } | null;
  metaPath: string | null;
  supportsAutoPatching: false;
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
