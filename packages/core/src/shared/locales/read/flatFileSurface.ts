import { readRuntimeFsTextSync } from '../../../runtime/helpers/sync/fs.js';
import { ISSUE_IO_READ_FAILED } from '../../constants/issueCodes.js';
import { parseJsonText } from '../../json/parse.js';
import { collectTranslationSurfaceLeaves, localeLeafFileOriginForFlatLocaleJson } from '../leaves/index.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/fileOrigin.js';
import type { TranslationSurfaceLeaf } from '../../../types/locales/leaves/translationSurface.js';
import type { RuntimeFsPort } from '../../../types/runtime/fs.js';
import type { LocaleReadDiagnostic } from '../../../types/locales/read.js';

export type ReadFlatLocaleJsonSurfaceResult =
  | { ok: true; document: unknown; leaves: TranslationSurfaceLeaf[]; text: string; diagnostics: LocaleReadDiagnostic[] }
  | { ok: false; leaves: []; diagnostics: LocaleReadDiagnostic[] };

/**
 * Read one flat `localesDir/<locale>.json` file and return the normalized translation surface with
 * {@link TranslationSurfaceLeaf.fileOrigin} attached.
 *
 * @remarks Pure aside from host `fs` I/O. Does not throw on read/parse failure — returns `ok: false` and
 * {@link LocaleReadDiagnostic} rows so hosts can log without catching.
 */
export function readFlatLocaleJsonSurface(input: {
  fs: RuntimeFsPort;
  path: LocaleLeafPathApi;
  absoluteFile: string;
  localesDir: string;
  onDiagnostic?: (d: LocaleReadDiagnostic) => void;
}): ReadFlatLocaleJsonSurfaceResult {
  const diagnostics: LocaleReadDiagnostic[] = [];
  const emit = (d: LocaleReadDiagnostic) => {
    diagnostics.push(d);
    input.onDiagnostic?.(d);
  };

  try {
    const text = readRuntimeFsTextSync(input.absoluteFile, input.fs);
    let json: unknown;
    try {
      json = parseJsonText(text, {
        filePath: input.absoluteFile,
        code: 'IO',
        issueCode: ISSUE_IO_READ_FAILED,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      emit({
        level: 'error',
        code: 'locale_json_parse_failed',
        message,
        path: input.absoluteFile,
      });
      return { ok: false, leaves: [], diagnostics };
    }

    const fileOrigin = localeLeafFileOriginForFlatLocaleJson({
      path: input.path,
      absoluteFile: input.absoluteFile,
      localesDir: input.localesDir,
    });
    const leaves = collectTranslationSurfaceLeaves(json, '', [], fileOrigin);
    return { ok: true, document: json, leaves, text, diagnostics };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    emit({
      level: 'error',
      code: 'locale_fs_read_failed',
      message,
      path: input.absoluteFile,
    });
    return { ok: false, leaves: [], diagnostics };
  }
}
