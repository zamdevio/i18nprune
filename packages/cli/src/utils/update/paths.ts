import path from 'node:path';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { resolveVersionStateFilePath } from '@/shared/home/index.js';

const nodeFs = createNodeRuntimeAdapters().fs;

/** Absolute path to `<home>/state/version.json` (see `shared/home/resolve.ts`). */
export function getUpdateStateFilePath(): string {
  return resolveVersionStateFilePath();
}

export function ensureVersionStateDirExists(): void {
  nodeFs.mkdirp(path.dirname(getUpdateStateFilePath()));
}
