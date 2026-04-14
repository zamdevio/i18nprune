import { ENV_MISSING_DISPLAY_DEFAULT_TOP } from '@/constants/env.js';
import { logger } from '@/utils/logger/index.js';
import type { I18nPruneConfig } from '@/types/config/index.js';
import type { MissingPathDisplayOpts } from '@/types/command/missing/summary.js';
import type { RunOptions } from '@/types/core/runtime/index.js';

/** Fallback when env, config, and CLI omit a cap. */
export const MISSING_DISPLAY_DEFAULT_TOP = 10;

function parseEnvPositiveInt(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === '') return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 100_000) return undefined;
  return n;
}

/**
 * Effective default list cap for **`missing`** human output when **`--top`** is omitted.
 * Precedence: **`MISSING_DISPLAY_DEFAULT_TOP`** env → **`config.missing.displayDefaultTop`** → {@link MISSING_DISPLAY_DEFAULT_TOP}.
 */
export function resolveMissingHumanDefaultTop(config: I18nPruneConfig): number {
  const fromEnv = parseEnvPositiveInt(process.env[ENV_MISSING_DISPLAY_DEFAULT_TOP]);
  if (fromEnv !== undefined) return fromEnv;
  const fromFile = config.missing?.displayDefaultTop;
  if (fromFile !== undefined && Number.isInteger(fromFile) && fromFile >= 1 && fromFile <= 100_000) {
    return fromFile;
  }
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
