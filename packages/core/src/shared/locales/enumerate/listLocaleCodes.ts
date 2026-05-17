import type { ResolvedLocalesLayout } from '../../../types/locales/layout.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/segmentSource.js';
import type { ListLocaleCodesResult } from '../../../types/locales/enumerate.js';
import type { RuntimeFsPort } from '../../../types/runtime/fs.js';
import { listLocaleSegments } from './listLocaleSegments.js';

/** Unique locale codes for a layout, sorted lexicographically. */
export function listLocaleCodes(input: {
  layout: ResolvedLocalesLayout;
  fs: RuntimeFsPort;
  path: LocaleLeafPathApi;
}): ListLocaleCodesResult {
  const { segments, diagnostics } = listLocaleSegments(input);
  const codes = [...new Set(segments.map((s) => s.locale))].sort((a, b) => a.localeCompare(b));
  return { codes, diagnostics };
}
