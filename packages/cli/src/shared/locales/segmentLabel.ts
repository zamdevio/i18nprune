/** Human label for one locale code and its on-disk segment paths (no absolute paths). */
export function formatLocaleSegmentFilesLabel(
  localeCode: string,
  segmentRelativePaths: readonly string[],
): string {
  if (segmentRelativePaths.length === 0) return localeCode;
  if (segmentRelativePaths.length === 1) {
    return `${localeCode} · ${segmentRelativePaths[0]!}`;
  }
  const sorted = [...segmentRelativePaths].sort((a, b) => a.localeCompare(b));
  const preview = sorted.slice(0, 3).join(', ');
  const tail = sorted.length > 3 ? ` (+${String(sorted.length - 3)} more)` : '';
  return `${localeCode} · ${String(sorted.length)} files: ${preview}${tail}`;
}
