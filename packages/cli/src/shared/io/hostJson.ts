import path from 'node:path';

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

/** Non-recursive `*.json` basenames under `dirPath` (excludes `*.meta.json`). */
export function listHostJsonBasenames(dirPath: string, fs: RuntimeFsPort): string[] {
  if (!existsRuntimeFsSync(dirPath, fs)) return [];
  return listRuntimeFsDirSync(dirPath, fs)
    .filter((e) => e.kind === 'file' && e.name.endsWith('.json') && !e.name.endsWith('.meta.json'))
    .map((e) => e.name);
}

/** Write pretty-printed JSON + trailing newline (same shape as legacy `writeJsonFile`). */
export function writeHostJson(filePath: string, data: unknown, fs: RuntimeFsPort): void {
  const body = `${JSON.stringify(data, null, 2)}\n`;
  fs.mkdirp(path.dirname(filePath));
  fs.writeText(filePath, body);
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
