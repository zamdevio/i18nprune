/** Truncate/pad inventory verbose columns. */

export const INVENTORY_NAME_WIDTH = 33;
export const INVENTORY_TIER_WIDTH = 10;
export const INVENTORY_CATEGORY_WIDTH = 10;
export const INVENTORY_SYMBOL_KIND_WIDTH = 10;

export function formatInventoryName(name: string): string {
  if (name.length <= 30) return name.padEnd(INVENTORY_NAME_WIDTH);
  return `${name.slice(0, 30)}...`.padEnd(INVENTORY_NAME_WIDTH);
}

export function formatInventoryTier(tier: string): string {
  return tier.padEnd(INVENTORY_TIER_WIDTH);
}

export function formatInventoryCategory(category: string): string {
  return category.padEnd(INVENTORY_CATEGORY_WIDTH);
}

export function formatInventorySymbolKind(kind: string): string {
  return kind.padEnd(INVENTORY_SYMBOL_KIND_WIDTH);
}

/** Header row for verbose inventory (aligns with `·` data rows). */
export function formatVerboseInventoryHeader(): string {
  return `${formatInventoryName('name')} ${formatInventoryTier('tier')} ${formatInventoryCategory('category')} ${formatInventorySymbolKind('symbolKind')} targetSubpath`;
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
