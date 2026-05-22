import type { RunOptions } from '@i18nprune/core';
import { logger } from '@/utils/logger/index.js';
import type { LoggerMask } from '@/types/core/logger/index.js';
import { style } from '@/utils/style/index.js';

/** Unicode em dash — unknown / unavailable values (matches progress formatters). */
export const VERSION_UNKNOWN = '—' as const;

/** One styled line: pnpm first, then npm, joined with **or**. */
export function formatGlobalInstallHintLine(packageName = 'i18nprune'): string {
  return (
    `${style.blue('pnpm')} add -g ${packageName}@latest or ` +
    `${style.blue('npm')} install -g ${packageName}@latest`
  );
}

/** Print the global upgrade hint (`[info]` or `[notice]`). */
export function printGlobalInstallHints(
  run: RunOptions,
  mask?: LoggerMask,
  level: 'info' | 'notice' = 'notice',
): void {
  const line = formatGlobalInstallHintLine();
  if (level === 'info') {
    logger.info(line, run, mask);
  } else {
    logger.notice(line, run, mask);
  }
}
