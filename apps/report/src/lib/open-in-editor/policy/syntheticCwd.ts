const SYNTHETIC_CWD_EXACT = new Set(['/project', '/example/project', '/']);

/** Reports with placeholder cwd cannot open real local files. */
export function isSyntheticCwd(cwd: string): boolean {
  const normalized = cwd.replace(/\\/g, '/');
  return SYNTHETIC_CWD_EXACT.has(normalized);
}
