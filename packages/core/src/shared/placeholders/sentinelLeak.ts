import { emitRunMessage } from '../run/index.js';
import type { RunEmitter } from '../../types/shared/run/index.js';
import {
  ISSUE_LOCALE_PLACEHOLDER_SENTINEL_LEAK,
} from '../constants/issueCodes.js';
import { issueCodeRepoDocPathForIssueCode } from '../docs/issueAnchors.js';
import { getLocaleLeafAtPath } from '../json/localeLeafPath.js';
import { setAtPath } from '../json/path.js';
import { isStructuredLocaleLeafNode } from '../locales/leaves/walk/translationSurfaceWalk.js';
import type { Issue } from '../../types/json/envelope/index.js';
import { collectTranslationSurfaceLeaves } from '../locales/leaves/walk/translationSurfaceWalk.js';
import {
  containsPlaceholderSentinelLeak,
  isPlaceholderOnlyLeaf,
} from './index.js';

export type SentinelRepairMode = 'copy_source' | 'placeholder_copy' | 'translate';

export type SentinelLeakHit = {
  path: string;
  value: string;
  localeCode: string;
};

export type SentinelRepairRecord = {
  path: string;
  mode: SentinelRepairMode;
  from: string;
  to: string;
};

export { containsPlaceholderSentinelLeak };

/** Walk locale JSON (plain or metadata `.value` leaves). */
export function scanLocaleForSentinelLeaks(
  localeJson: unknown,
  opts?: { localeCode?: string },
): SentinelLeakHit[] {
  const localeCode = opts?.localeCode ?? '';
  const leaves = collectTranslationSurfaceLeaves(localeJson);
  return scanLeavesForSentinelLeaks(leaves, localeCode);
}

export function scanLeavesForSentinelLeaks(
  leaves: ReadonlyArray<{ path: string; value: string }>,
  localeCode: string,
): SentinelLeakHit[] {
  return leaves
    .filter((leaf) => containsPlaceholderSentinelLeak(leaf.value))
    .map((leaf) => ({ path: leaf.path, value: leaf.value, localeCode }));
}

/** Sync path: copy non-leak source strings over leaked targets. */
export function repairSentinelLeaksCopyFromSource(
  sourceLeaves: Map<string, string>,
  targetLeaves: Map<string, string>,
): { next: Map<string, string>; repairs: SentinelRepairRecord[] } {
  const next = new Map(targetLeaves);
  const repairs: SentinelRepairRecord[] = [];
  for (const [path, targetValue] of targetLeaves) {
    if (!containsPlaceholderSentinelLeak(targetValue)) continue;
    const sourceValue = sourceLeaves.get(path);
    if (sourceValue === undefined || containsPlaceholderSentinelLeak(sourceValue)) continue;
    next.set(path, sourceValue);
    repairs.push({ path, mode: 'copy_source', from: targetValue, to: sourceValue });
  }
  return { next, repairs };
}

/** Generate path: classify how each leaked path should be repaired. */
export function planSentinelLeakGenerateRepairs(
  hits: readonly SentinelLeakHit[],
  sourceLeaves: Map<string, string>,
): Array<{ path: string; mode: SentinelRepairMode; sourceValue: string }> {
  const planned: Array<{ path: string; mode: SentinelRepairMode; sourceValue: string }> = [];
  for (const hit of hits) {
    const sourceValue = sourceLeaves.get(hit.path);
    if (sourceValue === undefined || containsPlaceholderSentinelLeak(sourceValue)) continue;
    planned.push({
      path: hit.path,
      mode: isPlaceholderOnlyLeaf(sourceValue) ? 'placeholder_copy' : 'translate',
      sourceValue,
    });
  }
  return planned;
}

/** Resume: true if path should stay in generate pending set. */
export function isSentinelLeakPending(targetValue: string | undefined): boolean {
  return targetValue !== undefined && containsPlaceholderSentinelLeak(targetValue);
}

/** Target leaks where source at the same path also leaks — sync copy is skipped. */
export function findSentinelLeakCopySkipped(
  sourceLeaves: Map<string, string>,
  targetLeaves: Map<string, string>,
): Array<{ path: string; targetValue: string }> {
  const skipped: Array<{ path: string; targetValue: string }> = [];
  for (const [path, targetValue] of targetLeaves) {
    if (!containsPlaceholderSentinelLeak(targetValue)) continue;
    const sourceValue = sourceLeaves.get(path);
    if (sourceValue !== undefined && containsPlaceholderSentinelLeak(sourceValue)) {
      skipped.push({ path, targetValue });
    }
  }
  return skipped;
}

/** Apply copy-source repairs to locale JSON; structured leaves update `.value` only. */
export function applySentinelLeakRepairsToLocaleJson(
  localeJson: unknown,
  repairs: readonly SentinelRepairRecord[],
): unknown {
  let next = localeJson;
  for (const repair of repairs) {
    const cur = getLocaleLeafAtPath(next, repair.path);
    if (isStructuredLocaleLeafNode(cur)) {
      next = setAtPath(next, repair.path, { ...cur, value: repair.to });
    } else {
      next = setAtPath(next, repair.path, repair.to);
    }
  }
  return next;
}

export function formatSyncSentinelLeakNotice(input: {
  count: number;
  localeFile: string;
  dryRun: boolean;
}): string {
  const verb = input.dryRun ? 'Would copy' : 'Copied';
  return `${verb} ${String(input.count)} source value(s) over placeholder sentinel leaks in ${input.localeFile} (sync repair).`;
}

export function formatSyncSentinelLeakSourceAlsoLeaksMessage(input: {
  count: number;
  samplePaths: readonly string[];
}): string {
  const sample = input.samplePaths.join(', ');
  return `${String(input.count)} placeholder sentinel leak(s) skipped — source locale also leaks at the same path(s). Fix source copy first, then re-run sync. Sample paths: ${sample}`;
}

export function formatGenerateSentinelLeakNotice(input: {
  localeCode: string;
  copyCount: number;
  translateCount: number;
  dryRun: boolean;
}): string {
  const total = input.copyCount + input.translateCount;
  const verb = input.dryRun ? 'Would re-translate' : 'Re-translated';
  return `${verb} ${String(total)} placeholder sentinel leak(s) in ${input.localeCode} (${String(input.copyCount)} copied, ${String(input.translateCount)} translated).`;
}

export function sentinelLeakSuggestionCommands(localeCode: string): string[] {
  return [
    `i18nprune sync --target ${localeCode}`,
    `i18nprune generate --metadata --target ${localeCode}`,
  ];
}

export function formatSentinelLeakHeadline(input: { localeCode: string; count: number }): string {
  return (
    `Target locale "${input.localeCode}" has ${String(input.count)} leaf(es) with stale placeholder sentinels (__I18NPRUNE_*).`
  );
}

/** Human suggestion lines (CLI renders at detail/dim; issues use {@link sentinelLeakSuggestionCommands}). */
export function formatSentinelLeakSuggestionLines(localeCode: string): string[] {
  return [
    `Quick fix (copy source structure): i18nprune sync --target ${localeCode}`,
    `Proper fix (re-translate):       i18nprune generate --metadata --target ${localeCode}`,
  ];
}

export function formatSentinelLeakMessage(input: { localeCode: string; count: number }): string {
  return [formatSentinelLeakHeadline(input), ...formatSentinelLeakSuggestionLines(input.localeCode)].join('  ');
}

function truncateSentinelRepairValue(value: string, max = 48): string {
  const oneLine = value.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

/** Per-path repair preview for sync/generate human detail lines. */
export function formatSentinelRepairDetailLine(input: {
  path: string;
  mode: string;
  from: string;
  to: string;
}): string {
  return `  ${input.path} (${input.mode}): ${truncateSentinelRepairValue(input.from)} → ${truncateSentinelRepairValue(input.to)}`;
}

export function emitSentinelLeakSuggestionDetails(
  emit: RunEmitter | undefined,
  input: { op: 'validate' | 'quality' | 'review'; runId?: string; localeCode: string },
): void {
  if (!emit) return;
  for (const line of formatSentinelLeakSuggestionLines(input.localeCode)) {
    emitRunMessage(emit, {
      op: input.op,
      runId: input.runId,
      level: 'detail',
      message: line,
      target: input.localeCode,
    });
  }
}

/** Build generate JSON repair rows from scan hits + planned modes (dry-run or preview). */
export function buildGenerateSentinelRepairRecords(
  hits: readonly SentinelLeakHit[],
  planned: ReturnType<typeof planSentinelLeakGenerateRepairs>,
  localeCode: string,
  localeFile?: string,
): Array<{
  path: string;
  mode: 'placeholder_copy' | 'translate';
  localeCode: string;
  from: string;
  sourceValue: string;
  to?: string;
  localeFile?: string;
}> {
  const hitByPath = new Map(hits.map((hit) => [hit.path, hit.value]));
  return planned
    .filter(
      (row): row is { path: string; mode: 'placeholder_copy' | 'translate'; sourceValue: string } =>
        row.mode === 'placeholder_copy' || row.mode === 'translate',
    )
    .map((row) => ({
      path: row.path,
      mode: row.mode,
      localeCode,
      from: hitByPath.get(row.path) ?? '',
      sourceValue: row.sourceValue,
      ...(row.mode === 'placeholder_copy' ? { to: row.sourceValue } : {}),
      ...(localeFile !== undefined ? { localeFile } : {}),
    }));
}

export function issuesFromSentinelLeakHits(hits: readonly SentinelLeakHit[]): Issue[] {
  if (hits.length === 0) return [];
  const byLocale = new Map<string, SentinelLeakHit[]>();
  for (const hit of hits) {
    byLocale.set(hit.localeCode, [...(byLocale.get(hit.localeCode) ?? []), hit]);
  }
  return [...byLocale.entries()].map(([localeCode, localeHits]) => ({
    severity: 'warning' as const,
    code: ISSUE_LOCALE_PLACEHOLDER_SENTINEL_LEAK,
    message: formatSentinelLeakMessage({ localeCode, count: localeHits.length }),
    localeCode,
    paths: localeHits.map((h) => h.path),
    suggestion: { commands: sentinelLeakSuggestionCommands(localeCode) },
    docPath: issueCodeRepoDocPathForIssueCode(ISSUE_LOCALE_PLACEHOLDER_SENTINEL_LEAK),
  }));
}
