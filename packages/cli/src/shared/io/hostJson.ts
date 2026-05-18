import { readJsonFromRuntimeFsSync } from '@i18nprune/core';
import type { RuntimeFsPort } from '@i18nprune/core';

/** Read JSON from disk using the host `RuntimeFsPort` (sync `readText`). */
export function readHostJsonUnknown(filePath: string, fs: RuntimeFsPort): unknown {
  return readJsonFromRuntimeFsSync(filePath, fs);
}
