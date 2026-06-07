import { applyCleanupKeysToLocaleJson } from './apply.js';
import { computeCleanupCandidateKeys } from './candidates.js';
import {
  emitCleanupStringPresenceEvidence,
  resolveCleanupEvidenceListWindow,
} from './evidenceEmit.js';
import { resolveCleanupKeysWithStringPresencePolicy } from './stringPresence.js';
import { readLocaleJsonFromContextSync, writeLocaleJsonFromContextSync } from '../shared/locales/index.js';
import { listCleanupSourceSegmentsForKeys, readCleanupSourceLeaves } from './sourceSurface.js';
import { resolveReferenceConfig } from '../shared/reference/resolveConfig.js';
import { buildKeyReferenceContextFromLiteralUsageAndDynamicSites } from '../shared/reference/context.js';
import { resolveProjectAnalysis } from '../analysis/index.js';
import { emitRunMessage } from '../shared/run/index.js';
import { I18nPruneError } from '../shared/errors/index.js';
import { finalizeLocaleSuggestions } from '../suggestions/index.js';
import {
  computeExtraTargetKeys,
  listTargetSegmentPathsForKeys,
} from '../suggestions/computeExtraTargetKeys.js';
import { resolveCleanupTargetLocaleCodes } from './resolveTargets.js';
import { hasLocaleLeafAtPath } from '../shared/json/localeLeafPath.js';
import { readLocaleLeavesForCode } from '../shared/locales/surface/localeSurface.js';
import { segmentsForLocaleCode, sourceLocaleCodeFromContext } from '../shared/locales/targets/index.js';
import {
  ISSUE_CLEANUP_RIPGREP_UNAVAILABLE,
  ISSUE_CLEANUP_UNCERTAIN_PATHS_EXCLUDED,
  ISSUE_LOCALE_TARGET_NOT_FOUND,
  ISSUE_SCAN_DYNAMIC_KEY_SITES,
} from '../shared/constants/issueCodes.js';
import type { ProjectAnalysis } from '../types/analysis/index.js';
import type { CoreContext } from '../types/context/index.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { LocaleSuggestion } from '../types/suggestions/index.js';
import type {
  CleanupHostHooks,
  CleanupJsonOutput,
  CleanupJsonTargetEntry,
  CleanupLocaleSlice,
  CleanupRunOptions,
  CleanupRunResult,
  CleanupSkippedTarget,
  CleanupWritePlan,
} from '../types/cleanup/index.js';

function issuesFromDynamicScanCount(count: number): Issue[] {
  if (count <= 0) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_SCAN_DYNAMIC_KEY_SITES,
      message: `${String(count)} translation call(s) use a non-literal key — static analysis cannot enumerate computed keys as fixed paths.`,
      docPath: 'dynamic/README',
    },
  ];
}

function issuesFromCleanupUncertainExcluded(excludedCount: number): Issue[] {
  if (excludedCount <= 0) return [];
  return [
    {
      severity: 'info',
      code: ISSUE_CLEANUP_UNCERTAIN_PATHS_EXCLUDED,
      message: `${String(excludedCount)} path(s) excluded under uncertain key prefix policy.`,
      docPath: 'commands/cleanup/README',
    },
  ];
}

function issuesFromCleanupStringPresenceUnavailable(input: {
  skipStringPresenceCheck: boolean;
  stringPresenceAvailable: boolean;
}): Issue[] {
  if (input.skipStringPresenceCheck || input.stringPresenceAvailable) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_CLEANUP_RIPGREP_UNAVAILABLE,
      message:
        'String-presence safety is unavailable — cleanup uses a narrower reference check. Configure a host string-presence probe for stronger safety.',
      docPath: 'commands/cleanup/README',
    },
  ];
}

function emitCleanupMessage(
  host: Pick<CleanupHostHooks, 'emit' | 'runId'>,
  input: {
    level: 'detail' | 'info' | 'notice' | 'warn';
    message: string;
    channel?: 'verbose';
    data?: Record<string, string | number | boolean | null>;
    path?: string;
  },
): void {
  emitRunMessage(host.emit, { op: 'cleanup', runId: host.runId, ...input });
}

export function createCleanupLocaleWritePlan(
  ctx: CoreContext,
  localeCode: string,
  keysToRemove: readonly string[],
): CleanupWritePlan {
  const segments = segmentsForLocaleCode(ctx, localeCode).filter((segment) => {
    const raw = readLocaleJsonFromContextSync(ctx, segment.absolutePath);
    return keysToRemove.some((key) => hasLocaleLeafAtPath(raw, key));
  });
  const writes = segments.flatMap((segment) => {
    const localeJson = readLocaleJsonFromContextSync(ctx, segment.absolutePath);
    const applied = applyCleanupKeysToLocaleJson(localeJson, keysToRemove);
    if (applied.removedPaths.length === 0) return [];
    return [
      {
        sourcePath: segment.absolutePath,
        relativePath: segment.relativePath,
        nextSourceJson: applied.next,
        removedPaths: applied.removedPaths,
      },
    ];
  });
  const removedPaths = writes.flatMap((w) => w.removedPaths);
  const primary = writes[0];
  const fallbackPath =
    segments[0]?.absolutePath ??
    (localeCode === sourceLocaleCodeFromContext(ctx)
      ? ctx.paths.sourceLocale
      : segmentsForLocaleCode(ctx, localeCode)[0]?.absolutePath ?? ctx.paths.sourceLocale);
  return {
    writes,
    keys: [...keysToRemove],
    sourcePath: primary?.sourcePath ?? fallbackPath,
    nextSourceJson: primary?.nextSourceJson ?? readLocaleJsonFromContextSync(ctx, fallbackPath),
    removedPaths,
  };
}

export function createCleanupSourceWritePlan(
  ctx: CoreContext,
  keysToRemove: readonly string[],
): CleanupWritePlan {
  return createCleanupLocaleWritePlan(ctx, sourceLocaleCodeFromContext(ctx), keysToRemove);
}

export function writeCleanupPlan(ctx: CoreContext, plan: CleanupWritePlan): void {
  for (const write of plan.writes) {
    if (write.removedPaths.length === 0) continue;
    writeLocaleJsonFromContextSync(ctx, write.sourcePath, write.nextSourceJson);
  }
}

export function emitCleanupAbortMessage(
  host: Pick<CleanupHostHooks, 'emit' | 'runId'>,
  reason: 'no_keys_approved' | 'declined_confirmation',
): void {
  emitCleanupMessage(host, {
    level: 'notice',
    message:
      reason === 'no_keys_approved'
        ? 'aborted: no keys approved for removal.'
        : 'aborted: user declined confirmation.',
    data: { reason },
  });
}

export function emitCleanupAskIgnoredMessage(host: Pick<CleanupHostHooks, 'emit' | 'runId'>): void {
  emitCleanupMessage(host, { level: 'info', message: '--ask ignored (not an interactive terminal).' });
}

export function emitCleanupWriteIntro(
  host: Pick<CleanupHostHooks, 'emit' | 'runId'>,
  input: { removeCount: number; segmentFileCount: number; localeLabel: string; isTargetMode: boolean },
): void {
  if (input.isTargetMode) return;
  const fileHint =
    input.segmentFileCount > 1
      ? `${String(input.segmentFileCount)} segment file(s) for ${input.localeLabel}`
      : `${input.localeLabel} locale file`;
  emitCleanupMessage(host, {
    level: 'notice',
    message: `removing ${String(input.removeCount)} path(s) from ${fileHint}. Run \`i18nprune sync\` afterwards to align other locale files when needed.`,
    data: { removeCount: input.removeCount, segmentFileCount: input.segmentFileCount },
  });
}

export function emitCleanupWriteDone(
  host: Pick<CleanupHostHooks, 'emit' | 'runId'>,
  input: { plan: CleanupWritePlan; wrote: boolean },
): void {
  if (input.wrote) {
    for (const write of input.plan.writes) {
      emitCleanupMessage(host, {
        level: 'detail',
        message: `wrote ${write.sourcePath}`,
        path: write.sourcePath,
      });
    }
  }
  const filesWritten = input.plan.writes.length;
  emitCleanupMessage(host, {
    level: 'info',
    message: `finished — ${String(filesWritten)} locale file(s) updated on disk.`,
    data: { filesWritten },
  });
}

function resolveCleanupListWindow(
  opts: CleanupRunOptions,
  host: CleanupHostHooks,
): { full: boolean; limit: number } {
  return resolveCleanupEvidenceListWindow({
    full: opts.full === true || host.listFull === true,
    top: opts.top ?? host.listLimit,
  });
}

function formatCleanupSkippedTargetHint(target: CleanupSkippedTarget): string {
  return target.suggestions?.length ? ` Did you mean: ${target.suggestions.join(', ')}?` : '';
}

function issuesFromCleanupSkippedTargets(skippedTargets: readonly CleanupSkippedTarget[]): Issue[] {
  if (skippedTargets.length === 0) return [];
  return skippedTargets.map((target) => ({
    severity: 'warning' as const,
    code: ISSUE_LOCALE_TARGET_NOT_FOUND,
    message:
      target.reason === 'source_locale'
        ? `cleanup: target "${target.localeCode}" is the source locale; omit --target for source cleanup.`
        : `cleanup: locale file not found for target "${target.localeCode}" (skipped).${formatCleanupSkippedTargetHint(target)}`,
    docPath: 'commands/cleanup/README',
  }));
}

function cleanupNoTargetMatchMessage(skippedTargets: readonly CleanupSkippedTarget[]): string {
  const hints = [
    ...new Set(skippedTargets.flatMap((target) => target.suggestions ?? [])),
  ];
  const suffix = hints.length > 0 ? ` Did you mean: ${hints.join(', ')}?` : '';
  return `cleanup: no target locale files matched --target selection.${suffix}`;
}

function mergeCleanupWritePlans(plans: readonly CleanupWritePlan[]): CleanupWritePlan {
  const writes = plans.flatMap((plan) => plan.writes);
  const keys = [...new Set(plans.flatMap((plan) => plan.keys))];
  const removedPaths = writes.flatMap((write) => write.removedPaths);
  const primary = writes[0];
  return {
    writes,
    keys,
    sourcePath: primary?.sourcePath ?? '',
    nextSourceJson: primary?.nextSourceJson ?? {},
    removedPaths,
  };
}

function localeRoleLabel(localeCode: string, isTargetMode: boolean, multi: boolean): string {
  if (multi) return localeCode;
  return isTargetMode ? `target locale (${localeCode})` : `source locale (${localeCode})`;
}

function segmentPathsForSlice(
  ctx: CoreContext,
  slice: Pick<CleanupLocaleSlice, 'localeCode' | 'isTargetMode' | 'safeToRemove'>,
): string[] {
  if (slice.safeToRemove.length === 0) return [];
  if (slice.isTargetMode) {
    return listTargetSegmentPathsForKeys(ctx, slice.localeCode, slice.safeToRemove);
  }
  return listCleanupSourceSegmentsForKeys(ctx, slice.safeToRemove).map((segment) => segment.relativePath);
}

function runCleanupLocaleSlice(
  ctx: CoreContext,
  opts: CleanupRunOptions,
  host: CleanupHostHooks,
  input: {
    localeCode: string;
    isTargetMode: boolean;
    multi: boolean;
    analysis: ProjectAnalysis;
    dynamicCount: number;
    refCtx: ReturnType<typeof buildKeyReferenceContextFromLiteralUsageAndDynamicSites>;
    eff: ReturnType<typeof resolveReferenceConfig>;
    skipStringPresenceCheck: boolean;
    stringPresenceAvailable: boolean;
  },
): CleanupLocaleSlice {
  const { localeCode, isTargetMode, multi, analysis, eff, refCtx } = input;
  const localeLabel = localeRoleLabel(localeCode, isTargetMode, multi);
  const linePrefix = multi ? `(${localeCode}) ` : '';

  if (!multi) {
    emitCleanupMessage(host, {
      level: 'info',
      message: `scanning ${localeLabel} and project sources for unused key paths...`,
      data: { localeCode, targetMode: isTargetMode },
    });
  }

  let candidates: string[];
  let excludedUncertain = 0;
  const leaves = isTargetMode ? readLocaleLeavesForCode(ctx, localeCode) : readCleanupSourceLeaves(ctx);
  const allKeyPaths = new Set(leaves.map((leaf) => leaf.path));

  if (isTargetMode) {
    const extra = computeExtraTargetKeys(ctx, analysis, localeCode);
    candidates = extra.candidates;
  } else {
    const filterUncertain = eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only';
    const computed = computeCleanupCandidateKeys({
      leaves,
      usage: analysis.usage,
      preserve: ctx.config.policies?.preserve,
      uncertainPrefixes: refCtx.uncertainPrefixes,
      filterUncertainPrefixes: filterUncertain,
    });
    candidates = computed.candidates;
    excludedUncertain = computed.excludedUncertain;
    allKeyPaths.clear();
    for (const path of computed.allKeyPaths) allKeyPaths.add(path);
  }

  if (!isTargetMode && excludedUncertain > 0) {
    emitCleanupMessage(host, {
      level: 'info',
      message: `excluded ${String(excludedUncertain)} path(s) under uncertain key prefix(es) (${eff.uncertainKeyPolicy}).`,
      data: { excludedUncertain, uncertainKeyPolicy: eff.uncertainKeyPolicy },
    });
  }

  emitCleanupMessage(host, {
    level: 'info',
    message: `${linePrefix}${String(allKeyPaths.size)} key path(s) in ${localeLabel} JSON · ${String(candidates.length)} unused candidate(s) after preserve / reference rules`,
    data: { keyPaths: allKeyPaths.size, candidates: candidates.length, localeCode },
  });

  const stringPresence = resolveCleanupKeysWithStringPresencePolicy({
    candidates,
    leaves,
    stringPresence: eff.stringPresence,
    stringPresenceMaxHitsPerKey: eff.stringPresenceMaxHitsPerKey,
    skipStringPresenceCheck: input.skipStringPresenceCheck,
    stringPresenceAvailable: input.stringPresenceAvailable,
    hasStringPresence: host.hasStringPresence,
    getStringPresenceLocations: host.getStringPresenceLocations,
    shouldRunStringPresenceForKey: host.shouldRunStringPresenceForKey,
  });

  if (stringPresence.evidence.length > 0) {
    emitCleanupStringPresenceEvidence(
      host,
      stringPresence.evidence,
      resolveCleanupListWindow(opts, host),
      multi ? localeCode : undefined,
    );
  }

  const safeToRemove = stringPresence.safeToRemove;
  const writePlan = createCleanupLocaleWritePlan(ctx, localeCode, safeToRemove);
  const segmentPaths = segmentPathsForSlice(ctx, { localeCode, isTargetMode, safeToRemove });

  if (safeToRemove.length === 0) {
    emitCleanupMessage(host, {
      level: 'info',
      message: multi
        ? `${linePrefix}nothing to remove (no unused keys after filters).`
        : 'nothing to remove (no unused keys after filters).',
      data: { localeCode },
    });
  }

  return {
    localeCode,
    isTargetMode,
    writePlan,
    sourceLeaves: leaves,
    allKeyPathCount: allKeyPaths.size,
    candidateKeys: candidates,
    safeToRemove,
    excludedUncertain,
    stringPresenceEvidence: stringPresence.evidence,
    segmentPaths,
  };
}

function buildCleanupBatchPayload(
  slices: readonly CleanupLocaleSlice[],
  input: {
    dynamic: number;
    uncertainPrefixes: string[];
    isTargetMode: boolean;
    targetLocaleCodes: string[];
    skippedTargets: CleanupSkippedTarget[];
    suggestions: LocaleSuggestion[];
  },
): CleanupJsonOutput {
  const targetEntries: CleanupJsonTargetEntry[] = slices
    .filter((slice) => slice.isTargetMode)
    .map((slice) => ({
      localeCode: slice.localeCode,
      wouldRemove: slice.safeToRemove.length,
      keys: [...slice.safeToRemove],
      ...(slice.segmentPaths.length > 0 ? { segmentPaths: slice.segmentPaths } : {}),
    }));
  const wouldRemove = slices.reduce((sum, slice) => sum + slice.safeToRemove.length, 0);
  const keys = slices.flatMap((slice) => slice.safeToRemove);
  const multiTarget = input.targetLocaleCodes.length > 1;

  return {
    wouldRemove,
    keys,
    dynamic: input.dynamic,
    uncertainPrefixes: input.uncertainPrefixes,
    ...(input.isTargetMode && !multiTarget && input.targetLocaleCodes[0]
      ? { targetLocale: input.targetLocaleCodes[0] }
      : {}),
    ...(multiTarget ? { targetLocales: [...input.targetLocaleCodes], targets: targetEntries } : {}),
    ...(input.skippedTargets.length > 0 ? { skippedTargets: [...input.skippedTargets] } : {}),
    suggestions: input.suggestions,
  };
}

export function runCleanup(
  ctx: CoreContext,
  opts: CleanupRunOptions,
  host: CleanupHostHooks,
): CleanupRunResult {
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const rawTarget = opts.target?.trim();
  const isTargetMode = Boolean(rawTarget);
  let targetLocaleCodes: string[] = [];
  let skippedTargets: CleanupSkippedTarget[] = [];

  if (isTargetMode) {
    const resolved = resolveCleanupTargetLocaleCodes(ctx, rawTarget!);
    targetLocaleCodes = resolved.localeCodes;
    skippedTargets = resolved.skippedTargets;
    if (targetLocaleCodes.length === 0) {
      throw new I18nPruneError(cleanupNoTargetMatchMessage(skippedTargets), 'USAGE');
    }
  }

  const isMultiTarget = targetLocaleCodes.length > 1;
  const eff = resolveReferenceConfig('cleanup', ctx.config);
  const analysis = resolveProjectAnalysis(ctx, { emit: host.emit, op: 'cleanup', runId: host.runId });
  const dynamic = analysis.dynamicSites;
  const refCtx = buildKeyReferenceContextFromLiteralUsageAndDynamicSites(analysis.usage, dynamic, eff);

  const skipStringPresenceCheck = Boolean(opts.skipStringPresenceCheck);
  const stringPresenceAvailable = skipStringPresenceCheck ? false : host.isStringPresenceAvailable();
  if (!skipStringPresenceCheck && !stringPresenceAvailable && eff.stringPresence !== 'off') {
    emitCleanupMessage(host, {
      level: 'warn',
      message: 'string-presence safety is unavailable — cleanup uses static key analysis only.',
    });
  }

  if (dynamic.length > 0) {
    emitCleanupMessage(host, {
      level: 'warn',
      message: `${String(dynamic.length)} translation call(s) use a non-literal key — cleanup literal-key inference may miss usage; tighten \`reference\` uncertain-key rules or inspect \`i18nprune validate\` / \`locales dynamic\`.`,
      data: { dynamic: dynamic.length },
    });
  }

  if (isMultiTarget) {
    emitCleanupMessage(host, {
      level: 'info',
      message: `scanning ${String(targetLocaleCodes.length)} target locale(s) (${targetLocaleCodes.join(', ')}) for unused key paths...`,
      data: { targetLocales: targetLocaleCodes.join(',') },
    });
  }

  const localeJobs = isTargetMode
    ? targetLocaleCodes.map((code) => ({ localeCode: code, isTargetMode: true as const }))
    : [{ localeCode: sourceCode, isTargetMode: false as const }];

  const localeSlices = localeJobs.map((job) =>
    runCleanupLocaleSlice(ctx, opts, host, {
      ...job,
      multi: isMultiTarget,
      analysis,
      dynamicCount: dynamic.length,
      refCtx,
      eff,
      skipStringPresenceCheck,
      stringPresenceAvailable,
    }),
  );

  const suggestions: LocaleSuggestion[] = [];
  if (opts.dryRun === true) {
    for (const slice of localeSlices) {
      if (slice.safeToRemove.length === 0) continue;
      const batch = finalizeLocaleSuggestions(
        host,
        {
          op: 'cleanup',
          ctx,
          analysis,
          dryRun: true,
          cleanupTarget: slice.isTargetMode ? slice.localeCode : undefined,
          cleanupRemoveCount: slice.safeToRemove.length,
          cleanupRemoveKeys: slice.safeToRemove,
        },
        { suggestions: [] },
      );
      suggestions.push(...batch.suggestions);
    }
  }

  const payload = buildCleanupBatchPayload(localeSlices, {
    dynamic: dynamic.length,
    uncertainPrefixes: isTargetMode ? [] : refCtx.uncertainPrefixes,
    isTargetMode,
    targetLocaleCodes,
    skippedTargets,
    suggestions,
  });

  const first = localeSlices[0]!;
  const writePlan = mergeCleanupWritePlans(localeSlices.map((slice) => slice.writePlan));
  const issues = [
    ...issuesFromDynamicScanCount(dynamic.length),
    ...issuesFromCleanupUncertainExcluded(
      localeSlices.reduce((sum, slice) => sum + slice.excludedUncertain, 0),
    ),
    ...issuesFromCleanupStringPresenceUnavailable({ skipStringPresenceCheck, stringPresenceAvailable }),
    ...issuesFromCleanupSkippedTargets(skippedTargets),
  ];

  return {
    payload,
    issues,
    localeSlices,
    writePlan,
    sourceLeaves: first.sourceLeaves,
    allKeyPathCount: localeSlices.reduce((sum, slice) => sum + slice.allKeyPathCount, 0),
    candidateKeys: localeSlices.flatMap((slice) => slice.candidateKeys),
    safeToRemove: localeSlices.flatMap((slice) => slice.safeToRemove),
    excludedUncertain: localeSlices.reduce((sum, slice) => sum + slice.excludedUncertain, 0),
    dynamic,
    keyObservationsCount: analysis.keyObservations.length,
    stringPresenceAvailable,
    stringPresenceEvidence: localeSlices.flatMap((slice) => slice.stringPresenceEvidence),
    localeCode: isTargetMode ? (isMultiTarget ? targetLocaleCodes.join(',') : targetLocaleCodes[0]!) : sourceCode,
    isTargetMode,
    isMultiTarget,
    targetLocaleCodes,
    skippedTargets,
  };
}
