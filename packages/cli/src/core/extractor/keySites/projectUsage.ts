import { scanProjectKeyObservations } from '@/core/extractor/keySites/orchestrate.js';
import type { Context } from '@/types/core/context/index.js';
import type { KeyObservation, ProjectLiteralKeyUsage } from '@/types/core/extractor/keySites/index.js';

function topPathSegment(path: string): string | null {
  const first = path.split(/[.[\]]/).find(Boolean);
  return first ?? null;
}

/**
 * Derive resolved keys, uncertain template prefixes, and top-level roots from key-site observations.
 * Use this when you already scanned the project (or a single file) so you do not re-run I/O.
 */
export function literalKeyUsageFromObservations(observations: KeyObservation[]): ProjectLiteralKeyUsage {
  const resolvedKeys = new Set<string>();
  const uncertainPrefixes = new Set<string>();
  const usedRoots = new Set<string>();

  for (const o of observations) {
    if (o.kind === 'literal' || o.kind === 'template_resolved') {
      resolvedKeys.add(o.resolvedKey);
      const root = topPathSegment(o.resolvedKey);
      if (root) usedRoots.add(root);
      continue;
    }
    if (o.kind === 'template_partial' && o.uncertainPrefix) {
      uncertainPrefixes.add(o.uncertainPrefix);
      const root = topPathSegment(o.uncertainPrefix);
      if (root) usedRoots.add(root);
    }
  }

  return { resolvedKeys, uncertainPrefixes, usedRoots };
}

/**
 * Compute per-project key usage with per-file const resolution.
 * This avoids cross-file identifier collisions (for example, duplicate `const NS`).
 */
export function scanProjectLiteralKeyUsage(ctx: Context): ProjectLiteralKeyUsage {
  return literalKeyUsageFromObservations(scanProjectKeyObservations(ctx));
}
