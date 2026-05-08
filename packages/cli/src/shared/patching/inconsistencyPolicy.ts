import { logger } from '@/utils/logger/index.js';
import type { RunOptions } from '@i18nprune/core';
import { PATCH_FIX_METADATA } from '@/shared/patching/guidance.js';

export function formatPreviewLines(lines: readonly string[], remaining: number): string[] {
  const listed = lines.map((line, idx) => `${String(idx + 1)}. ${line}`);
  if (remaining > 0) listed.push(`... and ${String(remaining)} more inconsistency(ies)`);
  return listed;
}

export async function decideInconsistencyApply(input: {
  run: RunOptions;
  fix: boolean;
  total: number;
  shownLines: readonly string[];
  remaining: number;
  autofilledCount: number;
  mismatchCount: number;
}): Promise<{ apply: boolean; skipped: boolean }> {
  const { run, fix, total, shownLines, remaining, autofilledCount, mismatchCount } = input;
  if (total <= 0) return { apply: false, skipped: false };
  if (fix) return { apply: true, skipped: false };
  const previewLines = formatPreviewLines(shownLines, remaining);
  logger.warn(
    `patch: found ${String(total)} locale metadata inconsistency(ies)` +
      ` (${String(autofilledCount)} missing field(s), ${String(mismatchCount)} mismatch(es)); ${PATCH_FIX_METADATA}`,
    run,
  );
  for (const line of previewLines) logger.detail(line, run);
  return { apply: false, skipped: true };
}
