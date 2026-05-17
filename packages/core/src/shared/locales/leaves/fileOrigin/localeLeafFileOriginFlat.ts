import type { LocaleLeafFileOrigin, LocaleLeafPathApi } from '../../../../types/locales/leaves/fileOrigin.js';

/**
 * Build storage provenance for a single locale JSON file under the flat `localesDir/*.json` layout.
 *
 * @remarks Pure — no IO. When `absoluteFile` is not under `localesDir`, `relativePath` falls back to the basename
 * so callers still get a stable segment label.
 */
export function localeLeafFileOriginForFlatLocaleJson(input: {
  path: LocaleLeafPathApi;
  absoluteFile: string;
  localesDir: string;
}): LocaleLeafFileOrigin {
  const { path, absoluteFile, localesDir } = input;
  const locale = path.basename(absoluteFile, '.json');
  let relativePath = path.relative(localesDir, absoluteFile);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    relativePath = path.basename(absoluteFile);
  }
  return {
    file: absoluteFile,
    locale,
    relativePath: relativePath.replace(/\\/g, '/'),
  };
}
