import type { DynamicKeySite } from '../../types/extractor/dynamic/index.js';
import type { DynamicSiteCountSplit, DynamicSiteGroups } from '../../types/extractor/dynamic/groups.js';

export function isCommentedDynamicSite(site: DynamicKeySite): boolean {
  return site.kind === 'commented' || site.isCommented === true;
}

/** Active vs commented totals for command summaries and analysis counts. */
export function splitDynamicSiteCounts(sites: readonly DynamicKeySite[]): DynamicSiteCountSplit {
  const groups = groupDynamicKeySites(sites);
  const commented = groups.commented;
  const total = sites.length;
  return { total, active: total - commented, commented };
}

/** `summary: dynamic=N · commented=M` fields (`commented` omitted when zero). */
export function dynamicSummaryCountFields(split: DynamicSiteCountSplit): Record<string, number> {
  const out: Record<string, number> = { dynamic: split.active };
  if (split.commented > 0) out.commented = split.commented;
  return out;
}

/** Roll-up counts for `locales dynamic` JSON / CLI grouping (E.6c). */
export function groupDynamicKeySites(sites: readonly DynamicKeySite[]): DynamicSiteGroups {
  const groups: DynamicSiteGroups = {
    mixedConstRuntime: 0,
    templateInterpolation: 0,
    nonLiteral: 0,
    emptyCall: 0,
    commented: 0,
  };
  for (const site of sites) {
    if (isCommentedDynamicSite(site)) {
      groups.commented += 1;
      continue;
    }
    if (site.kind === 'empty_call') {
      groups.emptyCall += 1;
      continue;
    }
    if (site.kind === 'non_literal') {
      groups.nonLiteral += 1;
      continue;
    }
    if (site.kind === 'template_interpolation') {
      groups.templateInterpolation += 1;
      if (site.classification === 'mixed_const_runtime') groups.mixedConstRuntime += 1;
    }
  }
  return groups;
}

export type { DynamicSiteGroups, DynamicSiteCountSplit } from '../../types/extractor/dynamic/groups.js';
