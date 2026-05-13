import {
  existsRuntimeFsSync,
  I18nPruneError,
  listRuntimeFsDirSync,
  readJsonFromRuntimeFsSync,
} from '@i18nprune/core';
import type { RuntimeFsPort } from '@i18nprune/core';

/** Read JSON from disk using the host `RuntimeFsPort` (sync `readText`). */
export function readHostJsonUnknown(filePath: string, fs: RuntimeFsPort): unknown {
  return readJsonFromRuntimeFsSync(filePath, fs);
}

/** `exists` + listable as a directory (matches legacy `fs.statSync(..).isDirectory()` for Node adapter). */
export function assertHostDirectory(dirPath: string, fs: RuntimeFsPort, messagePrefix = 'localesDir'): void {
  if (!existsRuntimeFsSync(dirPath, fs)) {
    throw new I18nPruneError(`${messagePrefix} is not a directory: ${dirPath}`, 'USAGE');
  }
  try {
    listRuntimeFsDirSync(dirPath, fs);
  } catch {
    throw new I18nPruneError(`${messagePrefix} is not a directory: ${dirPath}`, 'USAGE');
  }
}
