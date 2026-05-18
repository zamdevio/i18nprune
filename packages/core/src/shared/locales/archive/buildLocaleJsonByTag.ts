import type { LocalesFilesystemConfig } from '../../../config/schema/root.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/segmentSource.js';
import { localeCodeForSegment } from '../enumerate/parseSegmentLocale.js';
import { resolveLocalesLayout } from '../layout/resolveLayout.js';
/**
 * Build `localeJsonByTag` from archive-relative paths using the same segment rules as CLI enumeration.
 * When a locale has multiple segments, uses the primary segment (source path match, else lexicographically first).
 */
export function buildLocaleJsonByTagFromArchive(input: {
  localesDirAbsolute: string;
  sourceLocaleAbsolute?: string;
  /** Project-root-relative paths (e.g. `messages/en.json` from a zip). */
  archiveRelPaths: Iterable<string>;
  /** Resolve an archive-relative path to an absolute path on the virtual project root. */
  resolveArchiveAbsolute: (archiveRelPath: string) => string;
  path: LocaleLeafPathApi;
  locales: LocalesFilesystemConfig;
  readText: (archiveRelPath: string) => string | undefined;
}): Record<string, Record<string, unknown>> {
  const { path, localesDirAbsolute, archiveRelPaths, locales, readText, sourceLocaleAbsolute, resolveArchiveAbsolute } =
    input;
  const layout = resolveLocalesLayout(locales, localesDirAbsolute);
  const recursive = layout.structure !== 'locale_file';

  type Segment = { locale: string; relativePath: string; absolutePath: string; archiveRelPath: string };
  const segments: Segment[] = [];

  for (const archiveRelPath of archiveRelPaths) {
    if (!archiveRelPath.endsWith('.json')) continue;
    const absolutePath = resolveArchiveAbsolute(archiveRelPath);
    const relativePath = path.relative(localesDirAbsolute, absolutePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) continue;
    const segmentRel = relativePath.replace(/\\/g, '/');
    if (!recursive && relativePath.includes('/')) continue;

    const locale = localeCodeForSegment(layout.structure, path, { absolutePath, relativePath: segmentRel });
    if (locale === null) continue;
    segments.push({ locale, relativePath: segmentRel, absolutePath, archiveRelPath });
  }

  segments.sort((a, b) => {
    const byLocale = a.locale.localeCompare(b.locale);
    if (byLocale !== 0) return byLocale;
    return a.relativePath.localeCompare(b.relativePath);
  });

  const byLocale = new Map<string, Segment[]>();
  for (const segment of segments) {
    const list = byLocale.get(segment.locale) ?? [];
    list.push(segment);
    byLocale.set(segment.locale, list);
  }

  const out: Record<string, Record<string, unknown>> = {};
  for (const [locale, localeSegments] of byLocale) {
    let primary = localeSegments[0]!;
    if (sourceLocaleAbsolute !== undefined) {
      const sourceMatch = localeSegments.find((s) => s.absolutePath === sourceLocaleAbsolute);
      if (sourceMatch) primary = sourceMatch;
    }
    const raw = readText(primary.archiveRelPath);
    if (raw === undefined) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
      out[locale] = parsed as Record<string, unknown>;
    } catch {
      /* ignore invalid json */
    }
  }

  return out;
}
