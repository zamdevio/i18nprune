import { formatListOmittedSuffix, formatListShownOmitted } from '../shared/constants/listDisplay.js';
import type { SyncLocaleDisplayGroup, SyncHumanLeafSummary, SyncRunResult } from '../types/sync/index.js';

export function parseSyncReportKey(reportKey: string): { localeCode: string; segmentName: string | null } {
  const slash = reportKey.indexOf('/');
  if (slash === -1) {
    const base = reportKey.endsWith('.json') ? reportKey.slice(0, -5) : reportKey;
    return { localeCode: base, segmentName: null };
  }
  return { localeCode: reportKey.slice(0, slash), segmentName: reportKey.slice(slash + 1) };
}

export function buildSyncLocaleDisplayGroups(result: SyncRunResult): SyncLocaleDisplayGroup[] {
  const groups = new Map<string, SyncLocaleDisplayGroup>();
  for (let i = 0; i < result.targets.length; i++) {
    const reportKey = result.targets[i]!;
    const fileLine = result.fileLines[i];
    if (!fileLine) continue;
    const { localeCode } = parseSyncReportKey(reportKey);
    let group = groups.get(localeCode);
    if (!group) {
      group = { localeCode, reportKeys: [], fileLines: [], changedCount: 0, summaries: [] };
      groups.set(localeCode, group);
    }
    group.reportKeys.push(reportKey);
    group.fileLines.push(fileLine);
    if (fileLine.changed) group.changedCount += 1;
    const summary = result.humanLeafSummaryByLocaleFile[reportKey];
    if (summary) group.summaries.push(summary);
  }
  return [...groups.values()].sort((a, b) => a.localeCode.localeCompare(b.localeCode));
}

export function isSegmentedSyncLayout(groups: readonly SyncLocaleDisplayGroup[]): boolean {
  return groups.some((group) => group.reportKeys.length > 1);
}

export function mergeSyncHumanLeafSummaries(
  summaries: readonly SyncHumanLeafSummary[],
): SyncHumanLeafSummary {
  return summaries.reduce<SyncHumanLeafSummary>(
    (acc, summary) => ({
      hydratedFromSource: acc.hydratedFromSource + summary.hydratedFromSource,
      preservedExistingLeaves: acc.preservedExistingLeaves + summary.preservedExistingLeaves,
      prunedExtraLeaves: acc.prunedExtraLeaves + summary.prunedExtraLeaves,
    }),
    { hydratedFromSource: 0, preservedExistingLeaves: 0, prunedExtraLeaves: 0 },
  );
}

export function formatSyncLocaleFileDetailLine(
  group: SyncLocaleDisplayGroup,
  segmented: boolean,
  dryRun: boolean,
): string {
  const total = group.fileLines.length;
  if (!segmented || total === 1) {
    const reportKey = group.reportKeys[0] ?? group.localeCode;
    const fileLine = group.fileLines[0]!;
    const mark = fileLine.changed ? '✓' : '·';
    const tail = fileLine.changed ? (dryRun ? ' (would write)' : ' (written)') : ' (unchanged)';
    return `  ${mark} ${reportKey}${tail}`;
  }
  const unchanged = total - group.changedCount;
  if (group.changedCount === 0) {
    return `  · ${group.localeCode} · unchanged (${String(total)} segment files)`;
  }
  if (group.changedCount === total) {
    const verb = dryRun ? 'would change' : 'updated';
    return `  ✓ ${group.localeCode} · ${verb} (${String(total)} segment files)`;
  }
  const updatedVerb = dryRun ? 'would change' : 'updated';
  return `  · ${group.localeCode} · ${String(group.changedCount)} ${updatedVerb} · ${String(unchanged)} unchanged (${String(total)} segment files)`;
}

export function formatSyncFileListOmittedLine(shownLocaleCount: number, omittedLocaleCount: number): string {
  if (omittedLocaleCount <= 0) return '';
  const prefix = `  · ${String(shownLocaleCount)} locale(s) shown`;
  return formatListShownOmitted(prefix, omittedLocaleCount);
}

export function formatSyncLeafSummaryLabel(group: SyncLocaleDisplayGroup, segmented: boolean): string {
  if (!segmented || group.reportKeys.length === 1) {
    return group.reportKeys[0] ?? group.localeCode;
  }
  return group.localeCode;
}

export { formatListOmittedSuffix };
