import type { LocaleLeafPathApi } from '../../../types/locales/leaves/fileOrigin.js';
import type { RuntimeFsPort } from '../../../types/runtime/fs.js';
import type { LocaleReadDiagnostic } from '../../../types/locales/read.js';

export type WriteFlatLocaleJsonDocumentResult =
  | { ok: true; diagnostics: LocaleReadDiagnostic[] }
  | { ok: false; diagnostics: LocaleReadDiagnostic[] };

/**
 * Persist a locale JSON document for the flat `*.json` per-locale layout (pretty-printed, trailing newline).
 *
 * @remarks Uses host `fs.mkdirp` then `fs.writeText`. Non-throwing: failures become {@link LocaleReadDiagnostic}
 * rows (same transport type as reads for host logging symmetry).
 */
export function writeFlatLocaleJsonDocument(input: {
  fs: RuntimeFsPort;
  path: LocaleLeafPathApi;
  absoluteFile: string;
  data: unknown;
  /** JSON indent spaces (default 2). */
  indent?: number;
  onDiagnostic?: (d: LocaleReadDiagnostic) => void;
}): WriteFlatLocaleJsonDocumentResult {
  const diagnostics: LocaleReadDiagnostic[] = [];
  const emit = (d: LocaleReadDiagnostic) => {
    diagnostics.push(d);
    input.onDiagnostic?.(d);
  };
  const indent = input.indent ?? 2;
  let body: string;
  try {
    body = `${JSON.stringify(input.data, null, indent)}\n`;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    emit({ level: 'error', code: 'locale_json_serialize_failed', message, path: input.absoluteFile });
    return { ok: false, diagnostics };
  }
  try {
    input.fs.mkdirp(input.path.dirname(input.absoluteFile));
    input.fs.writeText(input.absoluteFile, body);
    return { ok: true, diagnostics };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    emit({ level: 'error', code: 'locale_fs_write_failed', message, path: input.absoluteFile });
    return { ok: false, diagnostics };
  }
}
