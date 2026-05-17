import type { Issue } from '@i18nprune/core';
import { rows, up } from '@/shared/cursor/index.js';
import { logger } from '@/utils/logger/index.js';
import {
  ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR,
  ISSUE_GENERATE_TRANSLATE_RATE_LIMITED,
} from '@i18nprune/core';
import type { Context } from '@/types/core/context/index.js';

function extractMyMemoryWaitHint(issues: readonly Issue[]): string | null {
  for (const i of issues) {
    if (typeof i.message !== 'string') continue;
    const m = i.message.match(/Wait time reported by MyMemory:\s*([^.\n]+)\./i);
    if (m && m[1] && m[1].trim() !== '') return m[1].trim();
  }
  return null;
}

export function logTranslateFailureHelp(ctx: Context, command: 'generate', issues: readonly Issue[]): void {
  const codes = new Set(issues.map((i) => i.code));
  if (codes.has(ISSUE_GENERATE_TRANSLATE_RATE_LIMITED)) {
    up(ctx.run, rows.gap);
    const wait = extractMyMemoryWaitHint(issues);
    const waitHint = wait ? ` Next available in ${wait}.` : '';
    logger.err(
      `${command}: translation backend rate-limited requests (HTTP 429).${waitHint} Try lowering --workers, waiting and retrying, or switching providers (MyMemory quotas are often too low for bulk runs).`,
    );
    return;
  }
  if (codes.has(ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR)) {
    up(ctx.run, rows.gap);
    logger.err(
      `${command}: network error talking to the translation backend. Check DNS/proxy/VPN/connectivity, then retry (also consider lowering --workers).`,
    );
    return;
  }
}
