/** Normalize user input: trim, lowercase, `_` → `-`. */
export function normalizeLanguageCode(code: string): string {
  return code.trim().toLowerCase().replace(/_/g, '-');
}
