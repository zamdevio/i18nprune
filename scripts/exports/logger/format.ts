/** Truncate/pad inventory verbose columns. */

export function formatInventoryName(name: string): string {
  if (name.length <= 30) return name.padEnd(33);
  return `${name.slice(0, 30)}...`;
}

export function formatInventoryTier(tier: string): string {
  return tier.padEnd(10);
}

export function formatInventoryCategory(category: string): string {
  return category.padEnd(10);
}

export function formatSubject(subject: string, maxLen: number, verbose?: boolean): string {
  if (verbose || subject.length <= maxLen) return subject;
  if (maxLen <= 3) return subject.slice(0, maxLen);
  return `${subject.slice(0, maxLen - 3)}...`;
}

export function compactCoreSourcePath(repoPath: string | null): string {
  if (!repoPath) return '(source unresolved)';
  const prefix = 'packages/core/src/';
  return repoPath.startsWith(prefix) ? repoPath.slice(prefix.length) : repoPath;
}
