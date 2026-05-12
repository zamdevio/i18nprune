import type { RuntimeFsPort } from '../../../types/runtime/fs.js';
import { ISSUE_IO_READ_FAILED } from '../../../shared/constants/issueCodes.js';
import { parseJsonText } from '../../../shared/json/parse.js';
import { readRuntimeFsTextSync } from './fs.js';

/**
 * Parse JSON from a host `RuntimeFsPort` using a **synchronous** `readText` result.
 * Used by CLI-style runners that are not async end-to-end yet.
 */
export function readJsonFromRuntimeFsSync(filePath: string, fs: RuntimeFsPort): unknown {
  return parseJsonText(readRuntimeFsTextSync(filePath, fs), {
    filePath,
    code: 'IO',
    issueCode: ISSUE_IO_READ_FAILED,
  });
}
