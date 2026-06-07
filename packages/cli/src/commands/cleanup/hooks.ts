import type { CleanupHostHooks } from '@i18nprune/core';

import { isRipgrepAvailable, rgFixedStringSearch, rgFixedStringSearchLocations } from '@/utils/rg/index.js';
import { logger } from '@/utils/logger/index.js';
import type { Context } from '@/types/core/context/index.js';
import { resolveCleanupRg } from '@/commands/cleanup/flags.js';
import type { CleanupOptions } from '@/types/command/cleanup/index.js';
import type { CleanupRuntime } from '@/types/command/cleanup/index.js';

/** Human-mode notices for cleanup run flags (not emitted for `--json`). */
export function emitCleanupCliModeNotices(ctx: Context, opts: CleanupOptions): void {
  if (!resolveCleanupRg(opts)) return;
  if (!isRipgrepAvailable()) {
    logger.notice(
      'ripgrep requested (--rg) but not on PATH; string-presence guard skipped — static scan and preserve/reference rules only.',
      ctx.run,
    );
  }
}

export function buildCleanupHostHooks(
  ctx: Context,
  runtime: CleanupRuntime = {},
  opts?: { rg?: boolean },
): CleanupHostHooks {
  const rg = opts?.rg === true;
  return {
    emit: runtime.emit,
    runId: runtime.runId,
    listLimit: runtime.listLimit,
    listFull: runtime.listFull,
    isStringPresenceAvailable: () => rg && isRipgrepAvailable(),
    hasStringPresence: (sample) => rgFixedStringSearch(ctx.paths.srcRoot, sample),
    getStringPresenceLocations: (sample, maxHits) =>
      rgFixedStringSearchLocations(ctx.paths.srcRoot, sample, maxHits).map((h) => `${h.path}:${String(h.line)}`),
    shouldRunStringPresenceForKey: rg ? () => true : () => false,
  };
}
