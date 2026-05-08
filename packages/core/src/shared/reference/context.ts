import { scanProjectDynamicKeySites } from '../../extractor/dynamic/orchestrate.js';
import {
  literalKeyUsageFromObservations,
  scanProjectLiteralKeyUsage,
} from '../../extractor/keySites/projectUsage.js';
import type { DynamicKeySite } from '../../types/extractor/dynamic/index.js';
import type { KeyObservation } from '../../types/extractor/keySites/index.js';
import type { ProjectLiteralKeyUsage } from '../../extractor/projectLiteralKeyUsage.js';
import type { ScanProjectLiteralKeyUsageInput } from '../../extractor/keySites/projectUsage.js';
import type { EffectiveReferenceConfig, KeyReferenceContext } from '../../types/reference/index.js';

export type BuildKeyReferenceContextInput = ScanProjectLiteralKeyUsageInput;

function pushUnique(out: string[], v: string): void {
  if (!v || out.includes(v)) return;
  out.push(v);
}

function includeDynamicSite(site: DynamicKeySite, eff: EffectiveReferenceConfig): boolean {
  if ((site.kind === 'commented' || site.isCommented) && !eff.treatCommentedCallSitesAsRuntime) return false;
  if (site.isSourceFile === false && !eff.treatNonSourceFileSitesAsRuntime) return false;
  return true;
}

function collectUncertainPrefixesFromDynamic(
  sites: DynamicKeySite[],
  out: string[],
  eff: EffectiveReferenceConfig,
): void {
  for (const site of sites) {
    if (!includeDynamicSite(site, eff)) continue;
    if (site.resolvedPrefix) pushUnique(out, site.resolvedPrefix);
  }
}

/**
 * Build proven key set and uncertain prefixes for cleanup / fill / sync / generate decisions.
 */
export function buildKeyReferenceContext(
  input: BuildKeyReferenceContextInput,
  eff: EffectiveReferenceConfig,
): KeyReferenceContext {
  const usage = scanProjectLiteralKeyUsage(input);
  const dynamicSites = scanProjectDynamicKeySites(input);
  return buildKeyReferenceContextFromLiteralUsageAndDynamicSites(usage, dynamicSites, eff);
}

/**
 * Same merge rules as {@link buildKeyReferenceContext}, but reuses folded literal usage plus dynamic sites
 * (typically from an already-built project report) so callers do not rescan twice.
 */
export function buildKeyReferenceContextFromLiteralUsageAndDynamicSites(
  usage: ProjectLiteralKeyUsage,
  dynamicSites: readonly DynamicKeySite[],
  eff: EffectiveReferenceConfig,
): KeyReferenceContext {
  const uncertainPrefixes: string[] = [];
  for (const p of usage.uncertainPrefixes) pushUnique(uncertainPrefixes, p);
  collectUncertainPrefixesFromDynamic([...dynamicSites], uncertainPrefixes, eff);
  return { provenKeys: usage.resolvedKeys, uncertainPrefixes };
}

/** Derive reference keys from **`scanProjectKeyObservations`** output plus dynamic sites (matches {@link buildKeyReferenceContext}). */
export function buildKeyReferenceContextFromReportDetails(
  observations: readonly KeyObservation[],
  dynamicSites: readonly DynamicKeySite[],
  eff: EffectiveReferenceConfig,
): KeyReferenceContext {
  const usage = literalKeyUsageFromObservations([...observations]);
  return buildKeyReferenceContextFromLiteralUsageAndDynamicSites(usage, dynamicSites, eff);
}
