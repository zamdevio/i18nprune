import { DEFAULT_LIST_TOP, formatListOmittedSuffix } from '@i18nprune/core';
import type { MissingPathDisplayOpts } from '@/types/command/missing/summary.js';

export function sliceMissingPathsForDisplay(
  paths: string[],
  opts: MissingPathDisplayOpts,
): { visible: string[]; omitted: number } {
  if (opts.fullList) {
    return { visible: paths, omitted: 0 };
  }
  const cap = opts.top ?? DEFAULT_LIST_TOP;
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
    lines.push(`  · ${String(visible.length)} key path(s) shown + ${formatListOmittedSuffix(omitted)}`);
  }
  return lines;
}
