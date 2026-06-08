import type { KeyObservation } from '../../types/extractor/keySites/index.js';
import { scanProjectKeyObservations } from './orchestrate.js';
import type { ScanProjectLiteralKeyUsageInput } from '../../types/extractor/keySites/projectUsage.js';
import type { ProjectLiteralKeyUsage } from '../../types/extractor/projectLiteralKeyUsage.js';

function topPathSegment(path: string): string | null {
  const first = path.split(/[.[\]]/).find(Boolean);
  return first ?? null;
}

/**
 * Derive resolved keys, uncertain template prefixes, and top-level roots from key-site observations.
 * Use this when you already scanned files so you do not re-run I/O.
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
      const root = topPathSegment(o.uncertainPrefix);
      if (root) usedRoots.add(root);
      // Linked partials defer prefix to the dynamic pass (single uncertainPrefixes contribution).
      if (!o.dynamicRef) uncertainPrefixes.add(o.uncertainPrefix);
    }
  }

  return { resolvedKeys, uncertainPrefixes, usedRoots };
}

/** Scan files and fold directly into project literal-key usage. */
export function scanProjectLiteralKeyUsage(input: ScanProjectLiteralKeyUsageInput): ProjectLiteralKeyUsage {
  return literalKeyUsageFromObservations(scanProjectKeyObservations(input));
}

