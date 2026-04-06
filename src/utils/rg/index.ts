import { spawnSync } from 'node:child_process';
import { logger } from '@/utils/logger/index.js';

/**
 * True when `rg --version` succeeds (ripgrep on PATH).
 */
export function isRipgrepAvailable(): boolean {
  const r = spawnSync('rg', ['--version'], { encoding: 'utf8' });
  return r.status === 0;
}

/** Print a helpful message for installing ripgrep. */
export function printRipgrepInstallHint(): void {
  logger.warn('ripgrep (rg) not found on PATH — cleanup safety is limited. Install: https://github.com/BurntSushi/ripgrep');
}

export function rgFixedStringSearch(rootDir: string, needle: string): boolean {
  const r = spawnSync(
    'rg',
    ['--fixed-strings', '--quiet', '--glob', '!**/node_modules/**', needle, rootDir],
    { encoding: 'utf8' },
  );
  return r.status === 0;
}
