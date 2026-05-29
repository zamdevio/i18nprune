import type { ResolvedLocalesLayout } from '../types/locales/layout.js';
import type { PatchingLocaleImportSpec, PatchingRuntimePorts } from '../types/patching/index.js';
import { listLocaleCodes } from '../shared/locales/enumerate/listLocaleCodes.js';
import { listLocaleSegments } from '../shared/locales/enumerate/listLocaleSegments.js';
import { listLocaleFilesFromDir } from './io.js';

/** Locale codes on disk for patching drift checks (respects i18nprune locales layout). */
export function listPatchingLocaleCodesOnDisk(input: {
  runtime: PatchingRuntimePorts;
  localesDir: string;
  layout?: ResolvedLocalesLayout;
}): string[] {
  const { runtime, localesDir, layout } = input;
  if (!layout || (layout.mode === 'flat_file' && layout.structure === 'locale_file')) {
    return listLocaleFilesFromDir(runtime, localesDir);
  }
  const resolvedLayout =
    layout.directoryAbsolute === localesDir
      ? layout
      : { ...layout, directoryAbsolute: localesDir };
  return listLocaleCodes({
    layout: resolvedLayout,
    fs: runtime.fs,
    path: runtime.path,
  }).codes;
}

/** Human-readable on-disk path hint for drift diagnostics. */
export function patchingLocaleDiskPathLabel(
  localesDirDisplay: string,
  code: string,
  layout?: ResolvedLocalesLayout,
): string {
  if (!layout || (layout.mode === 'flat_file' && layout.structure === 'locale_file')) {
    return `${localesDirDisplay}/${code}.json`;
  }
  if (layout.structure === 'locale_per_dir') {
    return `${localesDirDisplay}/${code}/*.json`;
  }
  if (layout.structure === 'feature_bundle') {
    return `${localesDirDisplay}/*/${code}.json`;
  }
  return `${localesDirDisplay}/${code}.json`;
}

function segmentBasenamesFromRelativePaths(relativePaths: readonly string[]): string[] {
  return [...new Set(relativePaths.map((rel) => rel.slice(rel.indexOf('/') + 1, -5)))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function featureBasenamesFromRelativePaths(relativePaths: readonly string[]): string[] {
  return [...new Set(relativePaths.map((rel) => rel.slice(0, rel.indexOf('/'))))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** How generated loaders should import JSON for each locale code. */
export function resolvePatchingLocaleImportSpec(input: {
  layout?: ResolvedLocalesLayout;
  runtime: PatchingRuntimePorts;
  localesDir: string;
  sourceLocaleCode: string;
}): PatchingLocaleImportSpec {
  const { layout, runtime, localesDir, sourceLocaleCode } = input;
  if (!layout || (layout.mode === 'flat_file' && layout.structure === 'locale_file')) {
    return { kind: 'flat_file' };
  }
  const resolvedLayout =
    layout.directoryAbsolute === localesDir
      ? layout
      : { ...layout, directoryAbsolute: localesDir };
  const { segments } = listLocaleSegments({
    layout: resolvedLayout,
    fs: runtime.fs,
    path: runtime.path,
  });
  const sourceSegments = segments.filter((s) => s.locale === sourceLocaleCode);
  const relativePaths = sourceSegments.map((s) => s.relativePath);

  if (layout.structure === 'locale_per_dir') {
    return { kind: 'locale_per_dir', segmentBasenames: segmentBasenamesFromRelativePaths(relativePaths) };
  }
  if (layout.structure === 'feature_bundle') {
    return { kind: 'feature_bundle', featureBasenames: featureBasenamesFromRelativePaths(relativePaths) };
  }
  return { kind: 'flat_file' };
}
