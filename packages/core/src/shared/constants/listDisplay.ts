/** Default max rows for bounded human / JSON list output when `--top` is omitted. */
export const DEFAULT_LIST_TOP = 3;

/** Suffix for truncated CLI / human list output (global `--top` / `--full`). */
export const LIST_MORE_HINT = '(use --full or --top <n>)';

/** `… 6 more (use --full or --top <n>)` */
export function formatListOmittedSuffix(omitted: number): string {
  return `… ${String(omitted)} more ${LIST_MORE_HINT}`;
}

/** `· 3 locales shown + … 2 more (use --full or --top <n>)` */
export function formatListShownOmitted(prefix: string, omitted: number): string {
  if (omitted <= 0) return prefix;
  return `${prefix} + ${formatListOmittedSuffix(omitted)}`;
}
