import { ISSUE_IO_READ_FAILED } from '../../constants/issueCodes.js';
import { I18nPruneError } from '../../errors/index.js';
import { isLocalesLayoutWriteSupported, resolveLocalesLayoutFromContext } from '../layout/resolveLayout.js';
import type { ResolvedLocalesLayout } from '../../../types/locales/layout.js';
import type { CoreContext } from '../../../types/context/index.js';
import { writeFlatLocaleJsonDocument } from './flatFileLocaleJson.js';
import type { WriteFlatLocaleJsonDocumentResult } from './flatFileLocaleJson.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/segmentSource.js';
import type { LocaleReadDiagnostic } from '../../../types/locales/read.js';
import type { RuntimeFsPort } from '../../../types/runtime/fs.js';

/**
 * Persist one locale segment file using {@link ResolvedLocalesLayout}.
 *
 * @remarks Phase 1 delegates to {@link writeFlatLocaleJsonDocument} for `flat_file` + `locale_file` only.
 */
export function writeLocaleBundle(input: {
  layout: ResolvedLocalesLayout;
  fs: RuntimeFsPort;
  path: LocaleLeafPathApi;
  absoluteFile: string;
  data: unknown;
  indent?: number;
  onDiagnostic?: (d: LocaleReadDiagnostic) => void;
}): WriteFlatLocaleJsonDocumentResult {
  const diagnostics: LocaleReadDiagnostic[] = [];
  const emit = (d: LocaleReadDiagnostic) => {
    diagnostics.push(d);
    input.onDiagnostic?.(d);
  };

  if (!isLocalesLayoutWriteSupported(input.layout)) {
    emit({
      level: 'error',
      code: 'locale_layout_unsupported',
      message: `locale write is not implemented for mode=${input.layout.mode} structure=${input.layout.structure}`,
      path: input.absoluteFile,
    });
    return { ok: false, diagnostics };
  }

  return writeFlatLocaleJsonDocument({
    fs: input.fs,
    path: input.path,
    absoluteFile: input.absoluteFile,
    data: input.data,
    indent: input.indent,
    onDiagnostic: input.onDiagnostic,
  });
}

/** Persist one locale JSON file via {@link writeLocaleBundle} and {@link CoreContext} layout. */
export function writeLocaleJsonFromContextSync(ctx: CoreContext, absoluteFile: string, data: unknown): void {
  const result = writeLocaleBundle({
    layout: resolveLocalesLayoutFromContext(ctx),
    fs: ctx.adapters.fs,
    path: ctx.adapters.path,
    absoluteFile,
    data,
  });
  if (!result.ok) {
    const message = result.diagnostics.map((d) => d.message).join(' · ') || 'failed to write locale JSON';
    throw new I18nPruneError(message, 'IO', { issueCode: ISSUE_IO_READ_FAILED });
  }
}
