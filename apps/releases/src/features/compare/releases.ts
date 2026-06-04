/** Section-by-section diff between two release records on the same stream. */
import { compareVersion } from '@/features/catalog/semver';
import type { ReleaseRecordV1 } from '@/types';

export const SECTION_KEYS = [
  'breaking',
  'security',
  'added',
  'changed',
  'fixed',
  'removed',
  'performance',
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  breaking: 'Breaking',
  security: 'Security',
  added: 'Added',
  changed: 'Changed',
  fixed: 'Fixed',
  removed: 'Removed',
  performance: 'Performance',
};

export type SectionDiff = {
  key: SectionKey;
  label: string;
  added: string[];
  removed: string[];
};

export type ReleaseCompareResult = {
  fromVersion: string;
  toVersion: string;
  from: ReleaseRecordV1;
  to: ReleaseRecordV1;
  sections: SectionDiff[];
  highlights: { added: string[]; removed: string[] };
  migration: { added: string[]; removed: string[] };
  summaryChanged: boolean;
  totals: { added: number; removed: number };
  hasChanges: boolean;
};

function diffLines(fromLines: string[], toLines: string[]) {
  const fromSet = new Set(fromLines);
  const toSet = new Set(toLines);
  return {
    added: toLines.filter((line) => !fromSet.has(line)),
    removed: fromLines.filter((line) => !toSet.has(line)),
  };
}

export function compareReleases(
  from: ReleaseRecordV1,
  to: ReleaseRecordV1,
): ReleaseCompareResult {
  const sections: SectionDiff[] = [];
  let added = 0;
  let removed = 0;

  for (const key of SECTION_KEYS) {
    const diff = diffLines(from.sections[key] ?? [], to.sections[key] ?? []);
    if (diff.added.length === 0 && diff.removed.length === 0) continue;
    added += diff.added.length;
    removed += diff.removed.length;
    sections.push({
      key,
      label: SECTION_LABELS[key],
      added: diff.added,
      removed: diff.removed,
    });
  }

  const highlights = diffLines(from.highlights ?? [], to.highlights ?? []);
  const migration = diffLines(from.migration?.notes ?? [], to.migration?.notes ?? []);
  added += highlights.added.length + migration.added.length;
  removed += highlights.removed.length + migration.removed.length;

  const summaryChanged = from.summary.trim() !== to.summary.trim();
  const hasChanges =
    added > 0 || removed > 0 || summaryChanged;

  return {
    fromVersion: from.version,
    toVersion: to.version,
    from,
    to,
    sections,
    highlights,
    migration,
    summaryChanged,
    totals: { added, removed },
    hasChanges,
  };
}

export function defaultComparePair(sortedDesc: string[]): { from: string; to: string } | null {
  if (sortedDesc.length < 2) return null;
  return { from: sortedDesc[1], to: sortedDesc[0] };
}

/** Older versions valid as "from" for a given "to". */
export function versionsOlderThan(sortedDesc: string[], toVersion: string): string[] {
  return sortedDesc.filter((v) => compareVersion(v, toVersion) < 0);
}

/** Newer versions valid as "to" for a given "from". */
export function versionsNewerThan(sortedDesc: string[], fromVersion: string): string[] {
  return sortedDesc.filter((v) => compareVersion(v, fromVersion) > 0);
}

export function normalizeComparePair(
  sortedDesc: string[],
  from: string,
  to: string,
): { from: string; to: string } {
  if (compareVersion(from, to) < 0) return { from, to };
  return { from: to, to: from };
}
