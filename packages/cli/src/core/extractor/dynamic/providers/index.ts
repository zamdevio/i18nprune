import {
  findDynamicKeySitesInJavascriptFile,
  isJavascriptLikePath,
} from '@/core/extractor/dynamic/providers/javascript.js';

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
): import('@/types/core/extractor/dynamic/index.js').DynamicKeySite[] {
  if (!isJavascriptLikePath(filePath)) {
    return [];
  }
  return findDynamicKeySitesInJavascriptFile(content, functions, filePath);
}
