import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import codes from './codes.json' with { type: 'json' };

import { buildGeneratedLanguageCatalog } from './build.js';
import type { GeneratedLanguageRow } from './build.js';
import { catalogCodesJsonPath } from './paths.js';

export type WriteLanguageCatalogResult = {
  rows: GeneratedLanguageRow[];
  outputPath: string;
  codesPath: string;
  inputCodeCount: number;
  bytesWritten: number;
};

export function writeGeneratedLanguageCatalogToPath(targetFile: string): WriteLanguageCatalogResult {
  const codeList = codes as string[];
  const list = buildGeneratedLanguageCatalog(codeList);
  const body = `${JSON.stringify(list, null, 2)}\n`;
  mkdirSync(path.dirname(targetFile), { recursive: true });
  writeFileSync(targetFile, body, 'utf8');
  return {
    rows: list,
    outputPath: targetFile,
    codesPath: catalogCodesJsonPath,
    inputCodeCount: codeList.length,
    bytesWritten: Buffer.byteLength(body, 'utf8'),
  };
}
