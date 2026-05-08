const UNICODE_SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** Renders a non-negative integer as Unicode superscript digits (e.g. slot **1** → `¹`, **12** → `¹²`). */
export function toUnicodeSuperscriptInt(n: number): string {
  const s = String(Math.max(0, Math.floor(n)));
  return [...s].map((ch) => UNICODE_SUPERSCRIPT_DIGITS[Number(ch)] ?? ch).join('');
}

/** Truncate with middle ellipsis for fixed-width progress lines. */
export function truncateMiddle(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = max - 1;
  const left = Math.floor(cut / 2);
  const right = cut - left;
  return s.slice(0, left) + '…' + s.slice(s.length - right);
}

/** Human-readable duration for progress footers. */
export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m)}m ${String(s)}s`;
}
