import type { Issue } from '../json/envelope/index.js';
import type { LocaleListRow } from './summaryRow.js';

export type ListJsonPayload = {
  kind: 'locales-list';
  sourceLocaleCode: string;
  sourceLocalePath: string;
  localesDir: string;
  localeCount: number;
  targetLocaleCount: number;
  rows: LocaleListRow[];
};

export type ListRunResult = {
  payload: ListJsonPayload;
  issues: Issue[];
};
