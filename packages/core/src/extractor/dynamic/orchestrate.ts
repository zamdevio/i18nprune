import { expandFunctionsWithBindings, scanImportBindings } from '../bindings/index.js';
import { scanProjectSourceFiles } from '../shared/projectScan.js';
import { findDynamicKeySitesForFile } from './providers/index.js';
import { findDynamicKeySitesInJavascriptMergedText } from './providers/javascript.js';
import type { ScanProjectFilesystemInputBase } from '../../types/extractor/projectScanInput.js';
import type { DynamicKeySite } from '../../types/extractor/dynamic/index.js';

export type ScanProjectDynamicKeySitesInput = ScanProjectFilesystemInputBase & {
  functions: string[];
};

/**
 * Reuse merged source text for callers that already have it (e.g. tests).
 * Per-file fields are omitted; comment detection is not applied across merged blobs.
 */
export function analyzeDynamicKeysFromSourceText(text: string, functions: string[]): DynamicKeySite[] {
  const effective = expandFunctionsWithBindings(functions, scanImportBindings(text));
  return findDynamicKeySitesInJavascriptMergedText(text, effective);
}

/** Project-wide dynamic-site scan with per-file path metadata. */
export function scanProjectDynamicKeySites(input: ScanProjectDynamicKeySitesInput): DynamicKeySite[] {
  return scanProjectSourceFiles({
    srcRoot: input.srcRoot,
    cwd: input.cwd,
    runtime: input.runtime,
    path: input.path,
    readFile: input.readFile,
    listFiles: input.listFiles,
    exclude: input.exclude,
    scanFile: ({ filePath, displayPath, text }) => {
      const functions = expandFunctionsWithBindings(input.functions, scanImportBindings(text));
      const sites = findDynamicKeySitesForFile(filePath, text, functions);
      return sites.map((site) => ({ ...site, filePath: displayPath }));
    },
  });
}
