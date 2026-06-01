import { collectTranslationSurfaceLeaves } from '../shared/locales/leaves/index.js';
import { getLocaleLeafAtPath } from '../shared/json/localeLeafPath.js';
import type { StringLeaf } from '../types/json/index.js';
import type { SyncHumanLeafSummary } from '../types/sync/humanLeafSummary.js';

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/**
 * Human-readable leaf string at a source template dotted path (plain terminal or `{ value }` object).
 */
export function readLeafDisplayString(root: unknown, pathStr: string): string | undefined {
  const v = getLocaleLeafAtPath(root, pathStr);
  if (typeof v === 'string') return v;
  if (isPlainObject(v) && typeof v.value === 'string') return v.value;
  return undefined;
}

/**
 * Map a collected string-leaf path (may end in `.value` for structured leaves) to a template path, if any.
 */
export function canonicalTemplatePathForCollectedLeaf(
  leafPath: string,
  templatePaths: ReadonlySet<string>,
): string | null {
  if (templatePaths.has(leafPath)) return leafPath;
  if (leafPath.endsWith('.value')) {
    const base = leafPath.slice(0, -'.value'.length);
    if (templatePaths.has(base)) return base;
  }
  return null;
}

/**
 * Derive **`hydrated` / preserved / pruned-extra** counts for stderr messaging.
 *
 * **`mergedLocaleJson`** should be **`computeSyncedLocaleJson`…`next`** (**before** `--metadata` / `--strip-metadata`)
 * so “extra path removed” reflects template merge/prune, not metadata reshaping alone.
 *
 * - **Hydrated**: template paths with no readable leaf (`string` or structured `.value`) in the locale before sync.
 * - **Preserved**: template paths where a readable leaf already existed beforehand.
 * - **Pruned extras**: logical translation paths from **`collectTranslationSurfaceLeaves(before)`** that do not map to any template path and
 *   are absent from **`mergedLocaleJson`** (best-effort; compares raw collected paths).
 */
export function summarizeSyncLeavesForHumanLog(
  sourceLeaves: readonly StringLeaf[],
  cur: unknown,
  mergedLocaleJson: unknown,
): SyncHumanLeafSummary {
  const templatePaths = new Set(sourceLeaves.map((l) => l.path));

  let hydratedFromSource = 0;
  let preservedExistingLeaves = 0;
  for (const pathStr of templatePaths) {
    const beforeStr = readLeafDisplayString(cur, pathStr);
    if (beforeStr === undefined) hydratedFromSource++;
    else preservedExistingLeaves++;
  }

  const beforeRawPaths = new Set(collectTranslationSurfaceLeaves(cur).map((leaf) => leaf.path));
  const afterRawPaths = new Set(collectTranslationSurfaceLeaves(mergedLocaleJson).map((leaf) => leaf.path));
  let prunedExtraLeaves = 0;
  for (const p of beforeRawPaths) {
    if (canonicalTemplatePathForCollectedLeaf(p, templatePaths) !== null) continue;
    if (!afterRawPaths.has(p)) prunedExtraLeaves += 1;
  }

  return { hydratedFromSource, preservedExistingLeaves, prunedExtraLeaves };
}
