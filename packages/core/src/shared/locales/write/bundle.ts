import { isLocalesLayoutSupported } from '../layout/resolveLayout.js';
import type { ResolvedLocalesLayout } from '../../../types/locales/layout.js';
import { writeFlatLocaleJsonDocument } from './flatFileLocaleJson.js';
import type { WriteFlatLocaleJsonDocumentResult } from './flatFileLocaleJson.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/fileOrigin.js';
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

  if (!isLocalesLayoutSupported(input.layout)) {
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
