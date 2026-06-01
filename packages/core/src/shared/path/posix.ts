/**
 * Logical path strings for JSON, logs, and cross-host comparisons — forward slashes only.
 * Not for passing to Win32 APIs that require `\\?\` extended paths.
 */
export function toPosixPath(value: string): string {
  return value.replace(/\\/g, '/');
}
