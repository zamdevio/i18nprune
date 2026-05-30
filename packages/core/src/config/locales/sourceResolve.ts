import type { LocalesFilesystemConfig } from '../../types/config/localesFilesystem.js';
import type { LocalesLayoutStructure } from '../../types/locales/layout.js';
import type { LocaleLeafPathApi } from '../../types/locales/leaves/segmentSource.js';
import type { RuntimeFsPort } from '../../types/runtime/fs.js';
import { localeCodeForSegment } from '../../shared/locales/enumerate/parseSegmentLocale.js';
import { listLocaleSegments } from '../../shared/locales/enumerate/listLocaleSegments.js';
import { walkLocaleJsonSegments } from '../../shared/locales/enumerate/walkJsonTree.js';
import { isLocalesStructureRequired } from '../../shared/locales/layout/requireStructure.js';
import { resolveLocalesLayout } from '../../shared/locales/layout/resolveLayout.js';
import { normalizeLanguageCode } from '../../shared/languages/normalize.js';

const STRUCTURE_GUESS_ORDER: readonly LocalesLayoutStructure[] = [
  'locale_per_dir',
  'feature_bundle',
  'locale_file',
];

function resolveSourceLocaleAbsoluteBeforeStructureKnown(input: {
  directoryAbsolute: string;
  path: LocaleLeafPathApi;
  fs?: RuntimeFsPort;
  sourceCode: string;
}): string {
  const { directoryAbsolute, path, fs, sourceCode } = input;
  if (fs) {
    const walked = walkLocaleJsonSegments({
      fs,
      path,
      rootAbsolute: directoryAbsolute,
      recursive: true,
    });
    const matches: { relativePath: string; absolutePath: string }[] = [];
    for (const segment of walked) {
      for (const structure of STRUCTURE_GUESS_ORDER) {
        const locale = localeCodeForSegment(structure, path, segment);
        if (locale !== null && normalizeLanguageCode(locale) === sourceCode) {
          matches.push({ relativePath: segment.relativePath, absolutePath: segment.absolutePath });
          break;
        }
      }
    }
    if (matches.length > 0) {
      const sorted = matches.slice().sort((a, b) => a.relativePath.localeCompare(b.relativePath));
      return sorted[0].absolutePath;
    }
  }
  return path.join(directoryAbsolute, `${sourceCode}.json`);
}

function pickPrimarySegmentAbsolute(
  path: LocaleLeafPathApi,
  directoryAbsolute: string,
  matches: { relativePath: string }[],
): string {
  const sorted = matches.slice().sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return path.join(directoryAbsolute, sorted[0].relativePath);
}

/** Resolve the on-disk primary source locale JSON file from `locales.source` (language code). */
export function resolveSourceLocaleAbsolutePath(input: {
  locales: LocalesFilesystemConfig;
  directoryAbsolute: string;
  path: LocaleLeafPathApi;
  fs?: RuntimeFsPort;
}): string {
  const code = normalizeLanguageCode(input.locales.source);
  if (isLocalesStructureRequired(input.locales)) {
    return resolveSourceLocaleAbsoluteBeforeStructureKnown({
      directoryAbsolute: input.directoryAbsolute,
      path: input.path,
      fs: input.fs,
      sourceCode: code,
    });
  }
  const layout = resolveLocalesLayout(input.locales, input.directoryAbsolute);

  if (layout.mode === 'flat_file' && layout.structure === 'locale_file') {
    return input.path.join(input.directoryAbsolute, `${code}.json`);
  }

  if (input.fs) {
    const { segments } = listLocaleSegments({ layout, fs: input.fs, path: input.path });
    const matches = segments.filter((s) => normalizeLanguageCode(s.locale) === code);
    if (matches.length > 0) {
      return pickPrimarySegmentAbsolute(input.path, input.directoryAbsolute, matches);
    }
  }

  return input.path.join(input.directoryAbsolute, `${code}.json`);
}

/** Resolve source locale absolute path from project-relative archive paths (zip / upload prepare). */
export function resolveSourceLocaleAbsoluteFromRelPaths(input: {
  locales: LocalesFilesystemConfig;
  directoryAbsolute: string;
  projectRootAbsolute: string;
  path: LocaleLeafPathApi;
  relPaths: readonly string[];
}): string {
  const code = normalizeLanguageCode(input.locales.source);
  const layout = resolveLocalesLayout(input.locales, input.directoryAbsolute);
  const dirRel = input.path.relative(input.projectRootAbsolute, input.directoryAbsolute).replace(/\\/g, '/');
  const prefix = dirRel === '.' || dirRel === '' ? '' : `${dirRel}/`;

  const matches: { relativePath: string; absolutePath: string }[] = [];
  for (const rel of input.relPaths) {
    const normalized = rel.replace(/\\/g, '/');
    if (!normalized.endsWith('.json')) continue;
    if (prefix && !normalized.startsWith(prefix) && normalized !== `${dirRel}/${code}.json`) {
      continue;
    }
    const underDir = prefix && normalized.startsWith(prefix) ? normalized.slice(prefix.length) : normalized;
    const absolutePath = input.path.join(input.projectRootAbsolute, normalized);
    const locale = localeCodeForSegment(layout.structure, input.path, {
      absolutePath,
      relativePath: underDir,
    });
    if (locale !== null && normalizeLanguageCode(locale) === code) {
      matches.push({ relativePath: underDir, absolutePath });
    }
  }

  if (matches.length > 0) {
    const sorted = matches.slice().sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    return sorted[0].absolutePath;
  }

  return resolveSourceLocaleAbsolutePath({
    locales: input.locales,
    directoryAbsolute: input.directoryAbsolute,
    path: input.path,
  });
}
