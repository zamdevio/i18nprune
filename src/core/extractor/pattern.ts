/** Regex-safe for `new RegExp` alternation parts. */
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build alternation for configured translation helper names (e.g. t, i18n.t). */
export function buildFunctionsPattern(functions: string[]): string {
  const parts = functions.map((f) => {
    const escaped = escapeRegex(f);
    return escaped.replace(/\\\./g, '\\.');
  });
  return `(?:${parts.join('|')})`;
}
