import type { LocalesLayoutStructure } from '../../../types/locales/layout.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/segmentSource.js';
import type { WalkedJsonSegment } from '../../../types/locales/walkJsonTree.js';

/**
 * Infer locale code for a walked segment using {@link LocalesLayoutStructure} rules.
 *
 * @returns `null` when the path does not belong to this structure (e.g. root-level JSON in `locale_per_dir`).
 */
export function localeCodeForSegment(
  structure: LocalesLayoutStructure,
  path: LocaleLeafPathApi,
  segment: WalkedJsonSegment,
): string | null {
  if (structure === 'locale_file') {
    if (segment.relativePath.includes('/')) return null;
    return path.basename(segment.absolutePath, '.json');
  }
  if (structure === 'locale_per_dir') {
    const slash = segment.relativePath.indexOf('/');
    if (slash < 0) return null;
    const locale = segment.relativePath.slice(0, slash);
    return locale.length > 0 ? locale : null;
  }
  if (structure === 'feature_bundle') {
    return path.basename(segment.absolutePath, '.json');
  }
  return null;
}
