import { issueCodeDocHref } from '@i18nprune/core';
import type { RunOptions } from '@i18nprune/core';
import { getRunOptions } from '@i18nprune/core';
import { logger } from '@/utils/logger/index.js';

/** Human stderr line linking an issue code to published docs (shown even under `--quiet`). */
export function logCliIssueGuidance(code: string, run?: RunOptions): void {
  if (!code.startsWith('i18nprune.')) return;
  logger.warn(`issue: ${code} · ${issueCodeDocHref(code)}`, run ?? getRunOptions());
}
