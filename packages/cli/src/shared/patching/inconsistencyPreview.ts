import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import type { I18nPruneConfig } from '@i18nprune/core/config';

export type MetadataInconsistencyItem = {
  code: string;
  field: 'englishName' | 'nativeName' | 'direction';
  current: string;
  recommended: string;
};

export type MissingMetadataFieldItem = {
  code: string;
  field: 'englishName' | 'nativeName' | 'direction';
  value: string;
};

export function buildInconsistencyPreview(input: {
  config: I18nPruneConfig;
  top?: number;
  full?: boolean;
  autofilled: readonly MissingMetadataFieldItem[];
  mismatches: readonly MetadataInconsistencyItem[];
}): { total: number; shown: string[]; remaining: number } {
  const { config, top, full, autofilled, mismatches } = input;
  const all = [
    ...autofilled.map((item) => `${item.code}.${item.field}: missing -> "${item.value}"`),
    ...mismatches.map((item) => `${item.code}.${item.field}: "${item.current}" -> "${item.recommended}"`),
  ];
  const total = all.length;
  const window = resolveCliListWindow(config, { top, full });
  const limit = window.limit;
  const shown = limit > 0 ? all.slice(0, limit) : [];
  return { total, shown, remaining: Math.max(0, total - shown.length) };
}
