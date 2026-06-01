import { readRuntimeFsTextSync } from '../../../runtime/helpers/sync/fs.js';
import { ISSUE_IO_READ_FAILED } from '../../constants/issueCodes.js';
import { parseJsonText } from '../../json/parse.js';
import { collectTranslationSurfaceLeaves } from '../leaves/index.js';
import { localeSegmentSourceForFile } from '../leaves/segmentSource/localeSegmentSourceForFile.js';
import type { LocalesLayoutStructure } from '../../../types/locales/layout.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/segmentSource.js';
import type { RuntimeFsPort } from '../../../types/runtime/fs.js';
import type { LocaleReadDiagnostic } from '../../../types/locales/read.js';
import type { ReadFlatLocaleJsonSurfaceResult } from '../../../types/locales/readFlatSurface.js';

export function readFlatLocaleJsonSurface(input: {
  fs: RuntimeFsPort;
  path: LocaleLeafPathApi;
  absoluteFile: string;
  localesDir: string;
  structure: LocalesLayoutStructure;
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
      emit({ level: 'error', code: 'locale_json_parse_failed', message, path: input.absoluteFile });
      return { ok: false, leaves: [], diagnostics };
    }

    const fileOrigin = localeSegmentSourceForFile({
      path: input.path,
      absoluteFile: input.absoluteFile,
      localesDir: input.localesDir,
      structure: input.structure,
    });
    const leaves = collectTranslationSurfaceLeaves(json, '', [], fileOrigin ?? undefined);
    return { ok: true, document: json, leaves, text, diagnostics };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    emit({ level: 'error', code: 'locale_fs_read_failed', message, path: input.absoluteFile });
    return { ok: false, leaves: [], diagnostics };
  }
}
