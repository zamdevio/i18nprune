import path from 'node:path';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { resolveVersionStateFilePath } from '@/shared/home/index.js';

const nodeFs = createNodeRuntimeAdapters().fs;

export function getUpdateStateFilePath(): string {
  return resolveVersionStateFilePath();
}

export function ensureConfigDirExists(): void {
  nodeFs.mkdirp(path.dirname(getUpdateStateFilePath()));
}
