import { existsRuntimeFsSync } from '../../runtime/helpers/sync/index.js';
import { localeCodeForSegment } from '../../shared/locales/enumerate/parseSegmentLocale.js';
import { walkLocaleJsonSegments } from '../../shared/locales/enumerate/walkJsonTree.js';
import type { LocalesLayoutMode, LocalesLayoutStructure } from '../../types/locales/layout.js';
import type { InitFilesystemHost } from '../../types/init/index.js';
import type { InitLocaleLayoutHint } from '../../types/init/index.js';

const STRUCTURES: readonly LocalesLayoutStructure[] = ['locale_file', 'locale_per_dir', 'feature_bundle'];

const LIKELY_LOCALE_CODE = /^[a-z]{2}(-[A-Z]{2})?$/i;

function isLikelyLocaleCode(code: string): boolean {
  return LIKELY_LOCALE_CODE.test(code);
}

function classifySegment(
  path: InitFilesystemHost['path'],
  segment: { absolutePath: string; relativePath: string },
): LocalesLayoutStructure | 'unknown' {
  if (!segment.relativePath.includes('/')) {
    return localeCodeForSegment('locale_file', path, segment) !== null ? 'locale_file' : 'unknown';
  }

  const slash = segment.relativePath.indexOf('/');
  const firstSegment = segment.relativePath.slice(0, slash);
  const basenameLocale = path.basename(segment.absolutePath, '.json');
  const perDir = localeCodeForSegment('locale_per_dir', path, segment);
  const bundle = localeCodeForSegment('feature_bundle', path, segment);

  if (perDir !== null && bundle !== null) {
    const firstLooksLocale = isLikelyLocaleCode(firstSegment);
    const baseLooksLocale = isLikelyLocaleCode(basenameLocale);
    if (baseLooksLocale && !firstLooksLocale) return 'feature_bundle';
    if (firstLooksLocale && !baseLooksLocale) return 'locale_per_dir';
    return 'unknown';
  }
  if (perDir !== null) return 'locale_per_dir';
  if (bundle !== null) return 'feature_bundle';
  return 'unknown';
}

/**
 * Infer `locales.mode` / `locales.structure` from on-disk JSON under **`localesDirectory`** (project-relative).
 *
 * @returns A hint only when every discovered segment agrees on one structure; otherwise `null`.
 */
export function detectLocaleFilesystemLayout(
  host: InitFilesystemHost,
  projectRoot: string,
  localesDirectory: string,
): InitLocaleLayoutHint | null {
  const rootAbsolute = host.path.join(projectRoot, localesDirectory);
  if (!existsRuntimeFsSync(rootAbsolute, host.fs)) {
    return null;
  }

  const segments = walkLocaleJsonSegments({
    fs: host.fs,
    path: host.path,
    rootAbsolute,
    recursive: true,
  });
  if (segments.length === 0) {
    return null;
  }

  const counts: Record<LocalesLayoutStructure | 'unknown', number> = {
    locale_file: 0,
    locale_per_dir: 0,
    feature_bundle: 0,
    unknown: 0,
  };

  for (const segment of segments) {
    const kind = classifySegment(host.path, segment);
    counts[kind] += 1;
  }

  if (counts.unknown > 0) {
    return null;
  }

  let winner: LocalesLayoutStructure | null = null;
  let winnerCount = 0;
  for (const structure of STRUCTURES) {
    const n = counts[structure];
    if (n > winnerCount) {
      winner = structure;
      winnerCount = n;
    }
  }

  if (winner === null || winnerCount !== segments.length) {
    return null;
  }

  const mode: LocalesLayoutMode = winner === 'locale_file' ? 'flat_file' : 'locale_directory';
  return {
    mode,
    structure: winner,
    confidence: 1,
    segmentCount: segments.length,
  };
}
