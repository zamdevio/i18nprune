import type { RuntimeDirEntry } from '../../../types/runtime/fs.js';
import type { RuntimeFsPort } from '../../../types/runtime/fs.js';
import { assertSyncPortResult } from './assert.js';

export function readRuntimeFsTextSync(filePath: string, fs: RuntimeFsPort): string {
  return assertSyncPortResult(fs.readText(filePath), 'fs.readText', filePath);
}

export function existsRuntimeFsSync(filePath: string, fs: RuntimeFsPort): boolean {
  return assertSyncPortResult(fs.exists(filePath), 'fs.exists', filePath);
}

export function listRuntimeFsDirSync(dirPath: string, fs: RuntimeFsPort): RuntimeDirEntry[] {
  return assertSyncPortResult(fs.listDir(dirPath), 'fs.listDir', dirPath);
}
