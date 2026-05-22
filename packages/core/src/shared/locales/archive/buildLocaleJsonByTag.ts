import type { LocalesFilesystemConfig } from '../../../config/schema/root.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/segmentSource.js';
import { localeCodeForSegment } from '../enumerate/parseSegmentLocale.js';
import { resolveLocalesLayout } from '../layout/resolveLayout.js';

type ArchiveLocaleSegment = {
  locale: string;
  relativePath: string;
  absolutePath: string;
  archiveRelPath: string;
};

/** Project-root-relative path under `localesDirAbsolute` (edge `path.relative` is not POSIX). */
function segmentRelUnderLocalesDir(localesDirAbsolute: string, absolutePath: string): string | null {
  const root = localesDirAbsolute.replace(/\\/g, '/').replace(/\/$/, '');
  const abs = absolutePath.replace(/\\/g, '/');
  if (abs === root) return '';
  const prefix = `${root}/`;
  if (!abs.startsWith(prefix)) return null;
  return abs.slice(prefix.length);
}

function collectArchiveLocaleSegments(input: {
  localesDirAbsolute: string;
  archiveRelPaths: Iterable<string>;
  resolveArchiveAbsolute: (archiveRelPath: string) => string;
  path: LocaleLeafPathApi;
  locales: LocalesFilesystemConfig;
}): ArchiveLocaleSegment[] {
  const { path, localesDirAbsolute, archiveRelPaths, locales, resolveArchiveAbsolute } = input;
  const layout = resolveLocalesLayout(locales, localesDirAbsolute);
  const recursive = layout.structure !== 'locale_file';

  const segments: ArchiveLocaleSegment[] = [];

  for (const archiveRelPath of archiveRelPaths) {
    if (!archiveRelPath.endsWith('.json')) continue;
    const absolutePath = resolveArchiveAbsolute(archiveRelPath);
    const segmentRel = segmentRelUnderLocalesDir(localesDirAbsolute, absolutePath);
    if (segmentRel === null) continue;
    if (!recursive && segmentRel.includes('/')) continue;

    const locale = localeCodeForSegment(layout.structure, path, { absolutePath, relativePath: segmentRel });
    if (locale === null) continue;
    segments.push({ locale, relativePath: segmentRel, absolutePath, archiveRelPath });
  }

  segments.sort((a, b) => {
    const byLocale = a.locale.localeCompare(b.locale);
    if (byLocale !== 0) return byLocale;
    return a.relativePath.localeCompare(b.relativePath);
  });

  return segments;
}

/**
 * Locale codes present in the archive for the resolved layout (enumeration only; no JSON parse).
 */
export function listLocaleCodesFromArchive(input: {
  localesDirAbsolute: string;
  archiveRelPaths: Iterable<string>;
  resolveArchiveAbsolute: (archiveRelPath: string) => string;
  path: LocaleLeafPathApi;
  locales: LocalesFilesystemConfig;
}): string[] {
  const segments = collectArchiveLocaleSegments(input);
  return [...new Set(segments.map((s) => s.locale))].sort((a, b) => a.localeCompare(b));
}

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
  const { readText, sourceLocaleAbsolute } = input;
  const segments = collectArchiveLocaleSegments(input);

  const byLocale = new Map<string, ArchiveLocaleSegment[]>();
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
