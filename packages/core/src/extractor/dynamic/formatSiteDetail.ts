import type { DynamicKeySite } from '../../types/extractor/dynamic/index.js';

/** Extra human-readable detail lines for a dynamic site (no I/O). */
export function dynamicSiteDetailLines(site: DynamicKeySite): string[] {
  const lines: string[] = [];
  if (site.kind !== 'template_interpolation') return lines;

  if (site.staticPrefix) {
    lines.push(`static prefix: ${site.staticPrefix}`);
  }
  if (site.constSubstitutions?.length) {
    const folds = site.constSubstitutions.map((s) => `${s.identifier} → ${s.value}`).join(', ');
    lines.push(`const folds: ${folds}`);
  }
  if (site.runtimeSegments?.length) {
    lines.push(`runtime holes: ${site.runtimeSegments.join(', ')}`);
  }
  if (site.classification && site.classification !== 'runtime_only') {
    lines.push(`classification: ${site.classification}`);
  }
  if (site.resolvedViaConstAssignment) {
    lines.push(`resolved via assignment: ${site.resolvedViaConstAssignment}`);
  }
  if (site.branchLiterals?.length) {
    lines.push(`branch literals: ${site.branchLiterals.join(', ')}`);
  }
  return lines;
}
