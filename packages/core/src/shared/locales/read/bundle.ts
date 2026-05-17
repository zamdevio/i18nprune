import { ISSUE_IO_READ_FAILED } from '../../constants/issueCodes.js';
import { I18nPruneError } from '../../errors/index.js';
import { isLocalesLayoutSupported, resolveLocalesLayoutFromContext } from '../layout/resolveLayout.js';
import type { ResolvedLocalesLayout } from '../../../types/locales/layout.js';
import type { CoreContext } from '../../../types/context/index.js';
import { readFlatLocaleJsonSurface } from './flatFileSurface.js';
import type { ReadFlatLocaleJsonSurfaceResult } from './flatFileSurface.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/fileOrigin.js';
import type { LocaleReadDiagnostic } from '../../../types/locales/read.js';
import type { RuntimeFsPort } from '../../../types/runtime/fs.js';

export type ReadLocaleBundleResult = ReadFlatLocaleJsonSurfaceResult;

/**
 * Read one locale segment file using {@link ResolvedLocalesLayout}.
 *
 * @remarks Phase 1 delegates to {@link readFlatLocaleJsonSurface} when `mode` is `flat_file` and
 * `structure` is `locale_file`. Other combinations return `ok: false` with `locale_layout_unsupported`.
 */
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

  if (!isLocalesLayoutSupported(input.layout)) {
    emit({
      level: 'error',
      code: 'locale_layout_unsupported',
      message: `locale read is not implemented for mode=${input.layout.mode} structure=${input.layout.structure}`,
      path: input.absoluteFile,
    });
    return { ok: false, leaves: [], diagnostics };
  }

  return readFlatLocaleJsonSurface({
    fs: input.fs,
    path: input.path,
    absoluteFile: input.absoluteFile,
    localesDir: input.layout.directoryAbsolute,
    onDiagnostic: input.onDiagnostic,
  });
}

/** Read one locale JSON file via {@link readLocaleBundle} and {@link CoreContext} layout. */
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
