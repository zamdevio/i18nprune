import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { exportsCacheRoot } from '../../paths.js';

export function readJsonFile<T>(filePath: string): T | undefined {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  } catch {
    return undefined;
  }
}

export function writeJsonAtomic(filePath: string, data: unknown): void {
  mkdirSync(exportsCacheRoot, { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}
