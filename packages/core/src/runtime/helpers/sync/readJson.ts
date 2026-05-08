import type { RuntimeFsPort } from '../../../types/runtime/fs.js';
import { readRuntimeFsTextSync } from './fs.js';

/**
 * Parse JSON from a host `RuntimeFsPort` using a **synchronous** `readText` result.
 * Used by CLI-style runners that are not async end-to-end yet.
 */
export function readJsonFromRuntimeFsSync(filePath: string, fs: RuntimeFsPort): unknown {
  return JSON.parse(readRuntimeFsTextSync(filePath, fs)) as unknown;
}
