import type { RunOptions } from '@i18nprune/core';
import { logger } from '@/utils/logger/index.js';
import { isI18nPruneHomeOverridden, resolveI18nPruneHomeDir } from './resolve.js';

/** One `[info]` line per command when `I18NPRUNE_HOME` overrides the default home directory. */
export function emitI18nPruneHomeOverrideNotice(run?: RunOptions): void {
  if (!isI18nPruneHomeOverridden()) return;
  const home = resolveI18nPruneHomeDir();
  logger.info(`Using custom i18nprune home (I18NPRUNE_HOME): ${home}`, run);
}
