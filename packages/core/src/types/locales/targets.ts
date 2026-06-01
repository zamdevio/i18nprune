import type { LocaleSegmentRef } from './enumerate.js';
import type { SyncLangSelection } from './syncLangSelection.js';

export type LocaleSegmentTarget = LocaleSegmentRef & {
  /** Stable report key: segment `relativePath` (e.g. `en.json`, `en/auth.json`). */
  reportKey: string;
};

export type ResolveLocaleSegmentTargetsInput = {
  selection: SyncLangSelection;
};
