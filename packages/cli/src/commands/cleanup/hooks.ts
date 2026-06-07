import type { CleanupHostHooks } from '@i18nprune/core';

import { isRipgrepAvailable, rgFixedStringSearch, rgFixedStringSearchLocations } from '@/utils/rg/index.js';
import { logger } from '@/utils/logger/index.js';
import type { Context } from '@/types/core/context/index.js';
import { resolveCleanupNoRg } from '@/commands/cleanup/flags.js';
import type { CleanupOptions } from '@/types/command/cleanup/index.js';
import type { CleanupRuntime } from '@/types/command/cleanup/index.js';

/** Human-mode notices for cleanup run flags (not emitted for `--json`). */
export function emitCleanupCliModeNotices(ctx: Context, opts: CleanupOptions): void {
  if (resolveCleanupNoRg(opts)) {
    logger.notice(
      'ripgrep string-presence guard skipped for this run (--no-rg); unused-key candidates rely on static scan and preserve/reference rules only.',
      ctx.run,
    );
    return;
  }
  if (!isRipgrepAvailable()) {
    logger.notice(
      'ripgrep not on PATH; string-presence guard skipped for this run. Install ripgrep or pass --no-rg to acknowledge static-only cleanup.',
      ctx.run,
    );
  }
}

export function buildCleanupHostHooks(
  ctx: Context,
  runtime: CleanupRuntime = {},
  opts?: { noRg?: boolean },
): CleanupHostHooks {
  const noRg = opts?.noRg === true;
  return {
    emit: runtime.emit,
    runId: runtime.runId,
    listLimit: runtime.listLimit,
    listFull: runtime.listFull,
    isStringPresenceAvailable: () => !noRg && isRipgrepAvailable(),
    hasStringPresence: (sample) => rgFixedStringSearch(ctx.paths.srcRoot, sample),
    getStringPresenceLocations: (sample, maxHits) =>
      rgFixedStringSearchLocations(ctx.paths.srcRoot, sample, maxHits).map((h) => `${h.path}:${String(h.line)}`),
    shouldRunStringPresenceForKey: noRg ? () => false : () => true,
  };
}
