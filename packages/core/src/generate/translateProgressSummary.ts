import type { TranslateRunPartialStats } from '../types/translator/runStats.js';

/** Human progress line for generate / generate --resume translation stats. */
export function formatGenerateTranslateProgress(
  target: string,
  wallMs: number,
  stats: TranslateRunPartialStats,
): string {
  const avgRequestMs = stats.requestAttempts > 0 ? Math.round(wallMs / stats.requestAttempts) : 0;
  return [
    `progress (${target}): wall=${String(wallMs)}ms`,
    `requests=${String(stats.requestAttempts)}`,
    `cacheHits=${String(stats.cacheHits)}`,
    `success=${String(stats.successfulLeaves)}`,
    `failed=${String(stats.failedRequests)}`,
    `retries=${String(stats.retriesMade)}`,
    `avgRequest=${String(avgRequestMs)}ms`,
  ].join(' · ');
}
