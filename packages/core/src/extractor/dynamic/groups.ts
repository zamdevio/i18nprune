import type { DynamicKeySite } from '../../types/extractor/dynamic/index.js';
import type { DynamicSiteGroups } from '../../types/extractor/dynamic/groups.js';

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
    if (site.kind === 'commented') {
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

export type { DynamicSiteGroups } from '../../types/extractor/dynamic/groups.js';
