import { style } from '@/utils/style/index.js';

/**
 * Horizontal rule with a centered label, e.g. **`  ── Sync summary ──`** (dim rules, accent title).
 */
export function formatSectionTitle(label: string): string {
  return `${style.dim('  ── ')}${style.bold(style.accent(label))}${style.dim(' ──')}`;
}
