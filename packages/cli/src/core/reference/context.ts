import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { scanProjectKeyObservations } from '@/core/extractor/keySites/index.js';
import { literalKeyUsageFromObservations } from '@/core/extractor/keySites/projectUsage.js';
import type { Context } from '@/types/core/context/index.js';
import type { DynamicKeySite } from '@/types/core/extractor/dynamic/index.js';
import type { EffectiveReferenceConfig } from '@/types/config/reference.js';
import type { KeyReferenceContext } from '@/types/core/reference/context.js';

function pushUnique(out: string[], v: string) {
  if (!v || out.includes(v)) return;
  out.push(v);
}

function includeDynamicSite(site: DynamicKeySite, eff: EffectiveReferenceConfig): boolean {
  if (site.kind === 'commented' || site.isCommented) {
    if (!eff.treatCommentedCallSitesAsRuntime) return false;
  }
  if (site.isSourceFile === false && !eff.treatNonSourceFileSitesAsRuntime) return false;
  return true;
}

function collectUncertainPrefixesFromDynamic(sites: DynamicKeySite[], out: string[], eff: EffectiveReferenceConfig): void {
  for (const s of sites) {
    if (!includeDynamicSite(s, eff)) continue;
    if (s.resolvedPrefix) pushUnique(out, s.resolvedPrefix);
  }
}

/**
 * Build proven key set and uncertain prefixes for cleanup / fill / sync decisions.
 */
export function buildKeyReferenceContext(
  ctx: Context,
  eff: EffectiveReferenceConfig,
): KeyReferenceContext {
  const observations = scanProjectKeyObservations(ctx);
  const dynamicSites = scanProjectDynamicKeySites(ctx);
  const usage = literalKeyUsageFromObservations(observations);
  const uncertainPrefixes: string[] = [];
  for (const p of usage.uncertainPrefixes) pushUnique(uncertainPrefixes, p);
  collectUncertainPrefixesFromDynamic(dynamicSites, uncertainPrefixes, eff);
  return { provenKeys: usage.resolvedKeys, uncertainPrefixes };
}
