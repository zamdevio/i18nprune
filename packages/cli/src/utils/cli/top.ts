import { I18nPruneError } from '@/core/errors/index.js';

/**
 * Parse `--top <n>` from Commander (string | undefined). Returns `undefined` when omitted.
 * @param flagLabel — e.g. `missing: --top` or `review: --top` (prepended to error message)
 */
export function parseCliPositiveIntTop(raw: string | undefined, flagLabel: string): number | undefined {
  if (raw === undefined || raw === '') return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new I18nPruneError(`${flagLabel} must be a positive integer`, 'USAGE');
  }
  return n;
}
