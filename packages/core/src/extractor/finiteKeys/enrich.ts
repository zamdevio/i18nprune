import { collectLocaleInferredCandidates } from './localeCandidates.js';
import type { DynamicKeySite } from '../../types/extractor/dynamic/index.js';
import type { TranslationSurfaceLeaf } from '../../types/locales/leaves/translationSurface.js';

function sitePrefix(site: DynamicKeySite): string | undefined {
  const raw = site.staticPrefix ?? site.resolvedPrefix;
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function stripCandidateFields(site: DynamicKeySite): DynamicKeySite {
  if (site.candidateKeys === undefined && site.candidateKeysTruncated === undefined) {
    return site;
  }
  const { candidateKeys: _ck, candidateKeysTruncated: _ct, ...rest } = site;
  return rest;
}

/**
 * Attach locale-inferred `candidateKeys` for template sites that expose a static /
 * resolved prefix. Idempotent: prior candidate fields are stripped first.
 * Does not mutate `sites` or leaf arrays.
 */
export function enrichDynamicSitesWithLocaleCandidates(
  sites: readonly DynamicKeySite[],
  leaves: readonly TranslationSurfaceLeaf[],
): DynamicKeySite[] {
  return sites.map((site) => {
    const base = stripCandidateFields(site);
    if (base.kind !== 'template_interpolation') return base;

    const prefix = sitePrefix(base);
    if (prefix === undefined) return base;

    const { candidates, truncated } = collectLocaleInferredCandidates(prefix, leaves);
    if (candidates.length === 0) return base;

    return {
      ...base,
      candidateKeys: candidates,
      ...(truncated ? { candidateKeysTruncated: true } : {}),
    };
  });
}
