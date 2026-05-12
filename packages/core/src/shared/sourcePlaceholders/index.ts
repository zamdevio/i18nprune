import { DEFAULT_MISSING_LEAF_PLACEHOLDER } from '../constants/missing.js';
import {
  ISSUE_LOCALE_SOURCE_PLACEHOLDER_LEAVES,
  ISSUE_LOCALE_TARGET_PLACEHOLDER_LEAVES,
} from '../constants/issueCodes.js';
import { issueCodeRepoDocPathForIssueCode } from '../docs/issueAnchors.js';
import { resolveMissingLeafPlaceholder } from '../../missing/placeholder.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { StringLeaf } from '../../types/json/index.js';

export type SourcePlaceholderLeaf = {
  path: string;
  value: string;
};

export type LocalePlaceholderLeaf = SourcePlaceholderLeaf & {
  localeRole: 'source' | 'target';
  localeCode: string;
  localePath?: string;
};

export function sourcePlaceholderValues(configuredPlaceholder: unknown): string[] {
  const resolved = resolveMissingLeafPlaceholder(configuredPlaceholder).placeholder;
  return [...new Set([DEFAULT_MISSING_LEAF_PLACEHOLDER, resolved].filter((value) => value.trim().length > 0))];
}

export function detectSourcePlaceholderLeaves(
  leaves: readonly StringLeaf[],
  placeholderValues: readonly string[],
): SourcePlaceholderLeaf[] {
  const sentinels = new Set(placeholderValues);
  if (sentinels.size === 0) return [];
  return leaves
    .filter((leaf) => sentinels.has(leaf.value))
    .map((leaf) => ({ path: leaf.path, value: leaf.value }));
}

export function detectLocalePlaceholderLeaves(input: {
  leaves: readonly StringLeaf[];
  placeholderValues: readonly string[];
  localeRole: 'source' | 'target';
  localeCode: string;
  localePath?: string;
}): LocalePlaceholderLeaf[] {
  return detectSourcePlaceholderLeaves(input.leaves, input.placeholderValues).map((leaf) => ({
    ...leaf,
    localeRole: input.localeRole,
    localeCode: input.localeCode,
    ...(input.localePath !== undefined ? { localePath: input.localePath } : {}),
  }));
}

export function formatSourcePlaceholderMessage(input: {
  count: number;
  samplePaths: readonly string[];
}): string {
  const sample = input.samplePaths.join(', ');
  return `Source locale has ${String(input.count)} missing placeholder value(s). Run \`i18nprune missing --full\` to list placeholder paths. Replace them with real source copy, then run \`i18nprune sync\` and \`i18nprune generate --resume\` for target locales. Sample paths: ${sample}`;
}

export function formatSyncSourcePlaceholderMessage(input: {
  count: number;
  samplePaths: readonly string[];
}): string {
  const sample = input.samplePaths.join(', ');
  return `Source locale has ${String(input.count)} missing placeholder value(s); sync skipped those path(s) so placeholders are not copied to target locales. Run \`i18nprune missing --full\` to list placeholder paths. Replace them with real source copy, then run \`i18nprune sync\` and \`i18nprune generate --resume\`. Sample paths: ${sample}`;
}

export function formatTargetPlaceholderMessage(input: {
  count: number;
  samplePaths: readonly string[];
  targetLabel?: string;
}): string {
  const sample = input.samplePaths.join(', ');
  const target = input.targetLabel === undefined ? 'Target locale' : `Target locale ${input.targetLabel}`;
  const listCommand =
    input.targetLabel === undefined
      ? 'i18nprune missing --target all --full'
      : `i18nprune missing --target ${input.targetLabel} --full`;
  return `${target} has ${String(input.count)} missing placeholder value(s). Run \`${listCommand}\` to list placeholder paths, then \`i18nprune sync\` and \`i18nprune generate --resume\` to refill translations. Sample paths: ${sample}`;
}

export function issuesFromSourcePlaceholderLeaves(leaves: readonly SourcePlaceholderLeaf[]): Issue[] {
  if (leaves.length === 0) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_LOCALE_SOURCE_PLACEHOLDER_LEAVES,
      message: formatSourcePlaceholderMessage({
        count: leaves.length,
        samplePaths: leaves.slice(0, 5).map((leaf) => leaf.path),
      }),
      docPath: issueCodeRepoDocPathForIssueCode(ISSUE_LOCALE_SOURCE_PLACEHOLDER_LEAVES),
    },
  ];
}

export function issuesFromTargetPlaceholderLeaves(leaves: readonly LocalePlaceholderLeaf[]): Issue[] {
  const targetLeaves = leaves.filter((leaf) => leaf.localeRole === 'target');
  if (targetLeaves.length === 0) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_LOCALE_TARGET_PLACEHOLDER_LEAVES,
      message: formatTargetPlaceholderMessage({
        count: targetLeaves.length,
        samplePaths: targetLeaves.slice(0, 5).map((leaf) => `${leaf.localeCode}:${leaf.path}`),
        ...(new Set(targetLeaves.map((leaf) => leaf.localeCode)).size === 1
          ? { targetLabel: targetLeaves[0]!.localeCode }
          : {}),
      }),
      docPath: issueCodeRepoDocPathForIssueCode(ISSUE_LOCALE_TARGET_PLACEHOLDER_LEAVES),
    },
  ];
}
