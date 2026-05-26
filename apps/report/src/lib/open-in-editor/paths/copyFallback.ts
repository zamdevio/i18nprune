import { isSyntheticCwd } from '../policy/syntheticCwd.js';
import { resolveAbsolutePath } from './resolve.js';

/**
 * Clipboard text when editor links are disabled.
 * Synthetic cwd → payload-relative path only (no fake absolutes).
 */
export function copyPathForFallback(input: {
  cwd: string;
  payloadPath: string;
}): string {
  if (isSyntheticCwd(input.cwd)) {
    return input.payloadPath;
  }
  return resolveAbsolutePath(input.cwd, input.payloadPath).absolutePath;
}
