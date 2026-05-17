import type { InitLocaleLayoutHint } from '../../types/init/index.js';

const LIKELY_LOCALE_CODE = /^[a-z]{2}(-[A-Z]{2})?$/i;

function isLikelyLocaleCode(code: string): boolean {
  return LIKELY_LOCALE_CODE.test(code);
}

function relativeSourcePath(directory: string, source: string): string {
  const dir = directory.replace(/\\/g, '/').replace(/\/$/, '');
  const src = source.replace(/\\/g, '/');
  if (src.startsWith(`${dir}/`)) {
    return src.slice(dir.length + 1);
  }
  return src;
}

/**
 * Infer layout from preset `locales.source` + `locales.directory` when the bundle tree is not on disk yet.
 */
export function inferLocaleLayoutFromConfigPaths(
  directory: string,
  source: string,
): InitLocaleLayoutHint | null {
  const rel = relativeSourcePath(directory, source);
  if (!rel.endsWith('.json')) {
    return null;
  }

  if (!rel.includes('/')) {
    return {
      mode: 'flat_file',
      structure: 'locale_file',
      confidence: 0.85,
      segmentCount: 1,
    };
  }

  const slash = rel.indexOf('/');
  const first = rel.slice(0, slash);
  const basenameLocale = rel.slice(slash + 1).replace(/\.json$/, '');

  if (isLikelyLocaleCode(basenameLocale) && !isLikelyLocaleCode(first)) {
    return {
      mode: 'locale_directory',
      structure: 'feature_bundle',
      confidence: 0.85,
      segmentCount: 1,
    };
  }
  if (isLikelyLocaleCode(first) && !isLikelyLocaleCode(basenameLocale)) {
    return {
      mode: 'locale_directory',
      structure: 'locale_per_dir',
      confidence: 0.85,
      segmentCount: 1,
    };
  }

  return null;
}
