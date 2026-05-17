import { ISSUE_IO_READ_FAILED } from '../../constants/issueCodes.js';
import { I18nPruneError } from '../../errors/index.js';
import { isLocalesLayoutReadSupported, resolveLocalesLayoutFromContext } from '../layout/resolveLayout.js';
import { localeSegmentRefFromAbsolute } from '../enumerate/resolveSegmentPath.js';
import type { ResolvedLocalesLayout } from '../../../types/locales/layout.js';
import type { CoreContext } from '../../../types/context/index.js';
import { readFlatLocaleJsonSurface } from './flatFileSurface.js';
import type { ReadFlatLocaleJsonSurfaceResult } from './flatFileSurface.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/segmentSource.js';
import type { LocaleReadDiagnostic } from '../../../types/locales/read.js';
import type { RuntimeFsPort } from '../../../types/runtime/fs.js';

export type ReadLocaleBundleResult = ReadFlatLocaleJsonSurfaceResult;

export function readLocaleBundle(input: {
  layout: ResolvedLocalesLayout;
  fs: RuntimeFsPort;
  path: LocaleLeafPathApi;
  absoluteFile: string;
  onDiagnostic?: (d: LocaleReadDiagnostic) => void;
}): ReadLocaleBundleResult {
  const diagnostics: LocaleReadDiagnostic[] = [];
  const emit = (d: LocaleReadDiagnostic) => {
    diagnostics.push(d);
    input.onDiagnostic?.(d);
  };

  if (!isLocalesLayoutReadSupported(input.layout)) {
    emit({
      level: 'error',
      code: 'locale_layout_unsupported',
      message: `locale read is not implemented for mode=${input.layout.mode} structure=${input.layout.structure}`,
      path: input.absoluteFile,
    });
    return { ok: false, leaves: [], diagnostics };
  }

  const segmentRef = localeSegmentRefFromAbsolute({
    layout: input.layout,
    path: input.path,
    absolutePath: input.absoluteFile,
  });
  if (segmentRef === null) {
    emit({
      level: 'warn',
      code: 'locale_read_path_layout_mismatch',
      message: `path does not match configured layout mode=${input.layout.mode} structure=${input.layout.structure}`,
      path: input.absoluteFile,
    });
    return { ok: false, leaves: [], diagnostics };
  }

  return readFlatLocaleJsonSurface({
    fs: input.fs,
    path: input.path,
    absoluteFile: input.absoluteFile,
    localesDir: input.layout.directoryAbsolute,
    structure: input.layout.structure,
    onDiagnostic: input.onDiagnostic,
  });
}

export function readLocaleJsonFromContextSync(ctx: CoreContext, absoluteFile: string): unknown {
  const read = readLocaleBundle({
    layout: resolveLocalesLayoutFromContext(ctx),
    fs: ctx.adapters.fs,
    path: ctx.adapters.path,
    absoluteFile,
  });
  if (!read.ok) {
    const message = read.diagnostics.map((d) => d.message).join(' · ') || 'failed to read locale JSON';
    throw new I18nPruneError(message, 'IO', { issueCode: ISSUE_IO_READ_FAILED });
  }
  return read.document;
}

export { readLocalePerDirLocaleSurface } from './perDirLocaleSurface.js';
