import type { RunEmitter, RunEvent } from '@i18nprune/core';

import { logger } from '@/utils/logger/index.js';
import type { RunOptions } from '@i18nprune/core';

export function renderRunEvent(event: RunEvent, run: RunOptions): void {
  if (event.type !== 'run.message') return;
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
