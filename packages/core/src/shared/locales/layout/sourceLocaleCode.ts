import type { ResolvedLocalesLayout } from '../../../types/locales/layout.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/segmentSource.js';
import { normalizeLanguageCode } from '../../languages/normalize.js';
import { localeSegmentRefFromAbsolute } from '../enumerate/resolveSegmentPath.js';

/**
 * Locale code for the configured source file using layout rules (not only the JSON basename).
 *
 * For `messages/en/app.json` under `locale_per_dir`, returns `en` — not `app`.
 */
export function sourceLocaleCodeForLayout(input: {
  layout: ResolvedLocalesLayout;
  path: LocaleLeafPathApi;
  sourceLocaleAbsolute: string;
}): string {
  const ref = localeSegmentRefFromAbsolute({
    layout: input.layout,
    path: input.path,
    absolutePath: input.sourceLocaleAbsolute,
  });
  if (ref !== null) {
    return normalizeLanguageCode(ref.locale);
  }
  return normalizeLanguageCode(input.path.basename(input.sourceLocaleAbsolute, '.json'));
}
