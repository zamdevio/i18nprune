import { isStructuredLocaleLeafNode } from './leaves/walk/translationSurfaceWalk.js';
import type { LocaleLeafProjection } from '../../types/locales/index.js';
import type { TranslationSurfaceLeaf } from '../../types/locales/leaves/translationSurface.js';

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

type LeafWinner = 'nested' | 'dotted';

function pushLeaf(
  out: Map<string, { leaf: TranslationSurfaceLeaf; winner: LeafWinner }>,
  leaf: TranslationSurfaceLeaf,
  winner: LeafWinner,
): { conflictsAdded: number } {
  const cur = out.get(leaf.path);
  if (!cur) {
    out.set(leaf.path, { leaf, winner });
    return { conflictsAdded: 0 };
  }
  // Prefer nested when both exist at same logical path.
  if (cur.winner === 'nested') {
    return { conflictsAdded: winner === 'dotted' ? 1 : 0 };
  }
  if (winner === 'nested') {
    out.set(leaf.path, { leaf, winner });
    return { conflictsAdded: 1 };
  }
  // dotted vs dotted: keep first (stable).
  return { conflictsAdded: 0 };
}

function collectLeavesPreferNested(input: {
  root: unknown;
  prefix: string;
  out: Map<string, { leaf: TranslationSurfaceLeaf; winner: LeafWinner }>;
  winner: LeafWinner;
}): { sawDottedKey: boolean; conflicts: number } {
  let sawDottedKey = false;
  let conflicts = 0;
  const { root, prefix } = input;

  if (typeof root === 'string') {
    if (prefix) {
      const { conflictsAdded } = pushLeaf(input.out, {
        path: prefix,
        value: root,
        shape: 'legacy_string',
        confidence: null,
        needsReview: null,
      }, input.winner);
      conflicts += conflictsAdded;
    }
    return { sawDottedKey, conflicts };
  }

  if (isStructuredLocaleLeafNode(root)) {
    if (prefix) {
      const { conflictsAdded } = pushLeaf(
        input.out,
        {
          path: prefix,
          value: root.value as string,
          shape: 'legacy_string',
          confidence: null,
          needsReview: null,
        },
        input.winner,
      );
      conflicts += conflictsAdded;
    }
    return { sawDottedKey, conflicts };
  }

  if (Array.isArray(root)) {
    root.forEach((item, i) => {
      const p = prefix ? `${prefix}[${i}]` : `[${i}]`;
      const r = collectLeavesPreferNested({ root: item, prefix: p, out: input.out, winner: input.winner });
      if (r.sawDottedKey) sawDottedKey = true;
      conflicts += r.conflicts;
    });
    return { sawDottedKey, conflicts };
  }

  if (isPlainObject(root)) {
    const keys = Object.keys(root);
    const nestedKeys = keys.filter((k) => !k.includes('.'));
    const dottedKeys = keys.filter((k) => k.includes('.'));
    for (const k of nestedKeys) {
      const p = prefix ? `${prefix}.${k}` : k;
      const r = collectLeavesPreferNested({ root: root[k], prefix: p, out: input.out, winner: input.winner });
      if (r.sawDottedKey) sawDottedKey = true;
      conflicts += r.conflicts;
    }
    for (const k of dottedKeys) {
      sawDottedKey = true;
      // Treat dotted keys as full logical paths from this prefix.
      const p = prefix ? `${prefix}.${k}` : k;
      const r = collectLeavesPreferNested({ root: root[k], prefix: p, out: input.out, winner: 'dotted' });
      if (r.sawDottedKey) sawDottedKey = true;
      conflicts += r.conflicts;
    }
  }

  return { sawDottedKey, conflicts };
}

/**
 * Project a locale JSON document into a canonical leaf map keyed by dotted paths.
 * This treats object keys containing `.` as path separators, but de-dupes conflicts:
 * if both `{ "a.b": "x" }` and `{ a: { b: "y" } }` exist, the nested `"y"` wins.
 */
export function projectLocaleLeaves(localeJson: unknown): LocaleLeafProjection {
  const tmp = new Map<string, { leaf: TranslationSurfaceLeaf; winner: LeafWinner }>();
  const r = collectLeavesPreferNested({ root: localeJson, prefix: '', out: tmp, winner: 'nested' });
  const byPath = new Map<string, TranslationSurfaceLeaf>();
  for (const [k, v] of tmp) byPath.set(k, v.leaf);
  return { byPath, sawDottedKey: r.sawDottedKey, conflicts: r.conflicts };
}

/** Read a string leaf value from a projection (legacy or structured). */
export function getProjectedLeafString(proj: LocaleLeafProjection, path: string): string | undefined {
  const leaf = proj.byPath.get(path);
  if (!leaf) return undefined;
  return leaf.value;
}

