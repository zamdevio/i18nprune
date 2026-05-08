import path from 'node:path';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import {
  existsRuntimeFsSync,
  listRuntimeFsDirSync,
  readRuntimeFsTextSync,
} from '@i18nprune/core/runtime/helpers/sync';

const nodeFs = createNodeRuntimeAdapters().fs;

export function readJsonFile(filePath: string): unknown {
  const raw = readRuntimeFsTextSync(filePath, nodeFs);
  return JSON.parse(raw) as unknown;
}

export function writeJsonFile(filePath: string, data: unknown): void {
  nodeFs.mkdirp(path.dirname(filePath));
  nodeFs.writeText(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function fileExists(filePath: string): boolean {
  return existsRuntimeFsSync(filePath, nodeFs);
}

/** Basenames `*.json` in a directory (non-recursive). */
export function listJsonBasenamesInDir(dir: string): string[] {
  if (!existsRuntimeFsSync(dir, nodeFs)) return [];
  return listRuntimeFsDirSync(dir, nodeFs)
    .filter((entry) => entry.kind === 'file')
    .map((entry) => entry.name)
    .filter((name) => name.endsWith('.json') && !name.endsWith('.meta.json'));
}
