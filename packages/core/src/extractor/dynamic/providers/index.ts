import {
  findDynamicKeySitesInJavascriptFile,
  isJavascriptLikePath,
} from './javascript.js';
import type { DynamicKeySite } from '../../../types/extractor/dynamic/index.js';

/**
 * Returns true if we have a dynamic-key provider for this path (extension-only; no folder guessing).
 */
export function hasDynamicProviderForPath(filePath: string): boolean {
  return isJavascriptLikePath(filePath);
}

/**
 * Run the appropriate provider for `filePath` or return empty array if none.
 */
export function findDynamicKeySitesForFile(
  filePath: string,
  content: string,
  functions: string[],
): DynamicKeySite[] {
  if (!isJavascriptLikePath(filePath)) {
    return [];
  }
  return findDynamicKeySitesInJavascriptFile(content, functions, filePath);
}

