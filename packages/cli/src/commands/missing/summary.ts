import { logger } from '@/utils/logger/index.js';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import type { MissingPathDisplayOpts } from '@/types/command/missing/summary.js';
import type { RunOptions } from '@/types/core/runtime/index.js';

/** Fallback when env, config, and CLI omit a cap. */
export const MISSING_DISPLAY_DEFAULT_TOP = 10;

/**
 * Effective default list cap for **`missing`** human output when **`--top`** is omitted.
 * Precedence: internal default {@link MISSING_DISPLAY_DEFAULT_TOP} unless CLI **`--top`** / **`--full-list`** is set.
 */
export function resolveMissingHumanDefaultTop(_config: I18nPruneConfig): number {
  return MISSING_DISPLAY_DEFAULT_TOP;
}

export function sliceMissingPathsForDisplay(
  paths: string[],
  opts: MissingPathDisplayOpts,
): { visible: string[]; omitted: number } {
  if (opts.fullList) {
    return { visible: paths, omitted: 0 };
  }
  const cap = opts.top ?? MISSING_DISPLAY_DEFAULT_TOP;
  if (!Number.isFinite(cap) || cap < 1) {
    return { visible: [], omitted: paths.length };
  }
  if (paths.length <= cap) {
    return { visible: paths, omitted: 0 };
  }
  return { visible: paths.slice(0, cap), omitted: paths.length - cap };
}

/** Indented lines for console (leading two spaces per path). */
export function formatMissingPathsDetailLines(paths: string[], opts: MissingPathDisplayOpts): string[] {
  const { visible, omitted } = sliceMissingPathsForDisplay(paths, opts);
  const lines = visible.map((p) => `  ${p}`);
  if (omitted > 0) {
    lines.push(`  … and ${String(omitted)} more (use --full-list or --top <n>)`);
  }
  return lines;
}

export function logMissingPathsPreview(
  paths: string[],
  display: MissingPathDisplayOpts,
  run: RunOptions | undefined,
): void {
  for (const line of formatMissingPathsDetailLines(paths, display)) {
    logger.detail(line, run);
  }
}
