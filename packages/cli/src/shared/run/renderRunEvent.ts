import type { RunEmitter, RunEvent } from '@i18nprune/core';

import { logger } from '@/utils/logger/index.js';
import type { RunOptions } from '@i18nprune/core';

const SHARE_VERBOSE_OUTPUT_MASK = { quiet: false } as const;

export function renderRunEvent(event: RunEvent, run: RunOptions): void {
  if (event.type !== 'run.message') return;
  if (event.channel === 'verbose') {
    if (event.level === 'detail') {
      logger.detail(event.message, run, SHARE_VERBOSE_OUTPUT_MASK);
      return;
    }
    logger.verbose(event.message, run, SHARE_VERBOSE_OUTPUT_MASK, { dim: false });
    return;
  }
  if (event.channel === 'cache') {
    if (event.level === 'detail') logger.cacheDetail(event.message, run);
    else logger.cache(event.message, run);
    return;
  }
  switch (event.level) {
    case 'detail':
      logger.detail(event.message, run);
      return;
    case 'info':
      logger.info(event.message, run);
      return;
    case 'notice':
      logger.notice(event.message, run);
      return;
    case 'tip': {
      const lines = event.message.split('\n');
      logger.tip(lines[0] ?? event.message, run);
      for (const line of lines.slice(1)) {
        if (line.trim().length > 0) logger.detail(line, run);
      }
      return;
    }
    case 'warn':
      logger.warn(event.message, run);
      return;
  }
}

export function createCliRunEmitter(run: RunOptions, next?: RunEmitter): RunEmitter {
  return (event) => {
    renderRunEvent(event, run);
    next?.(event);
  };
}
