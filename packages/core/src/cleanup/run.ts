import { applyCleanupKeysToLocaleJson } from './apply.js';
import { computeCleanupCandidateKeys } from './candidates.js';
import {
  emitCleanupStringPresenceEvidence,
  resolveCleanupEvidenceListWindow,
} from './evidenceEmit.js';
import { resolveCleanupKeysWithStringPresencePolicy } from './stringPresence.js';
import { readLocaleJsonFromContextSync, writeLocaleJsonFromContextSync } from '../shared/locales/index.js';
import { readCleanupSourceLeaves } from './sourceSurface.js';
import { resolveReferenceConfig } from '../shared/reference/resolveConfig.js';
import { buildKeyReferenceContextFromLiteralUsageAndDynamicSites } from '../shared/reference/context.js';
import { resolveProjectAnalysis } from '../analysis/index.js';
import { emitRunMessage } from '../shared/run/index.js';
import { finalizeLocaleSuggestions } from '../suggestions/index.js';
import { computeExtraTargetKeys } from '../suggestions/computeExtraTargetKeys.js';
import { assertNotSourceTargetLocale } from '../locales/source.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';
import { hasLocaleLeafAtPath } from '../shared/json/localeLeafPath.js';
import { readLocaleLeavesForCode } from '../shared/locales/surface/localeSurface.js';
import { segmentsForLocaleCode, sourceLocaleCodeFromContext } from '../shared/locales/targets/index.js';
import {
  ISSUE_CLEANUP_RIPGREP_UNAVAILABLE,
  ISSUE_CLEANUP_UNCERTAIN_PATHS_EXCLUDED,
  ISSUE_SCAN_DYNAMIC_KEY_SITES,
} from '../shared/constants/issueCodes.js';
import type { CoreContext } from '../types/context/index.js';
import type { Issue } from '../types/json/envelope/index.js';
import type {
  CleanupHostHooks,
  CleanupRunOptions,
  CleanupRunResult,
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
  input: { removeCount: number; segmentFileCount: number; localeLabel: string },
): void {
  const fileHint =
    input.segmentFileCount > 1
      ? `${String(input.segmentFileCount)} segment file(s) for ${input.localeLabel}`
      : `${input.localeLabel} locale file`;
  emitCleanupMessage(host, {
    level: 'warn',
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

export function runCleanup(
  ctx: CoreContext,
  opts: CleanupRunOptions,
  host: CleanupHostHooks,
): CleanupRunResult {
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const targetCode = opts.target ? normalizeLanguageCode(opts.target) : undefined;
  const isTargetMode = targetCode !== undefined;
  if (isTargetMode) {
    assertNotSourceTargetLocale('cleanup', targetCode!, ctx.paths.sourceLocale, {
      path: ctx.adapters.path,
      paths: ctx.paths,
    });
  }
  const localeCode = isTargetMode ? targetCode! : sourceCode;
  const localeLabel = isTargetMode ? `target locale (${localeCode})` : `source locale (${sourceCode})`;

  emitCleanupMessage(host, {
    level: 'info',
    message: `scanning ${localeLabel} and project sources for unused key paths...`,
    data: { localeCode, targetMode: isTargetMode },
  });

  const eff = resolveReferenceConfig('cleanup', ctx.config);
  const analysis = resolveProjectAnalysis(ctx, { emit: host.emit, op: 'cleanup', runId: host.runId });
  const dynamic = analysis.dynamicSites;
  const refCtx = buildKeyReferenceContextFromLiteralUsageAndDynamicSites(
    analysis.usage,
    dynamic,
    eff,
  );

  let candidates: string[];
  let excludedUncertain = 0;
  let leaves = isTargetMode ? readLocaleLeavesForCode(ctx, localeCode) : readCleanupSourceLeaves(ctx);
  const allKeyPaths = new Set(leaves.map((l) => l.path));

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

  const skipStringPresenceCheck = Boolean(opts.skipStringPresenceCheck);
  const stringPresenceAvailable = skipStringPresenceCheck ? false : host.isStringPresenceAvailable();
  if (!skipStringPresenceCheck && !stringPresenceAvailable && eff.stringPresence !== 'off') {
    emitCleanupMessage(host, {
      level: 'warn',
      message: 'string-presence safety is unavailable — cleanup uses static key analysis only.',
    });
  }

  emitCleanupMessage(host, {
    level: 'info',
    message: `${String(allKeyPaths.size)} key path(s) in ${localeLabel} JSON · ${String(candidates.length)} unused candidate(s) after preserve / reference rules`,
    data: { keyPaths: allKeyPaths.size, candidates: candidates.length, localeCode },
  });

  if (dynamic.length > 0) {
    emitCleanupMessage(host, {
      level: 'warn',
      message: `${String(dynamic.length)} translation call(s) use a non-literal key — cleanup literal-key inference may miss usage; tighten \`reference\` uncertain-key rules or inspect \`i18nprune validate\` / \`locales dynamic\`.`,
      data: { dynamic: dynamic.length },
    });
  }

  const stringPresence = resolveCleanupKeysWithStringPresencePolicy({
    candidates,
    leaves,
    stringPresence: eff.stringPresence,
    stringPresenceMaxHitsPerKey: eff.stringPresenceMaxHitsPerKey,
    skipStringPresenceCheck,
    stringPresenceAvailable,
    hasStringPresence: host.hasStringPresence,
    getStringPresenceLocations: host.getStringPresenceLocations,
    shouldRunStringPresenceForKey: host.shouldRunStringPresenceForKey,
  });

  emitCleanupStringPresenceEvidence(host, stringPresence.evidence, resolveCleanupListWindow(opts, host));

  const safeToRemove = stringPresence.safeToRemove;
  const writePlan = createCleanupLocaleWritePlan(ctx, localeCode, safeToRemove);
  const issues = [
    ...issuesFromDynamicScanCount(dynamic.length),
    ...issuesFromCleanupUncertainExcluded(excludedUncertain),
    ...issuesFromCleanupStringPresenceUnavailable({ skipStringPresenceCheck, stringPresenceAvailable }),
  ];
  const payload = finalizeLocaleSuggestions(
    host,
    {
      op: 'cleanup',
      ctx,
      analysis,
      dryRun: opts.dryRun,
      cleanupTarget: isTargetMode ? localeCode : undefined,
      cleanupRemoveCount: safeToRemove.length,
      cleanupRemoveKeys: safeToRemove,
    },
    {
      wouldRemove: safeToRemove.length,
      keys: safeToRemove,
      dynamic: dynamic.length,
      uncertainPrefixes: isTargetMode ? [] : refCtx.uncertainPrefixes,
      ...(isTargetMode ? { targetLocale: localeCode } : {}),
    },
  );

  if (safeToRemove.length === 0) {
    emitCleanupMessage(host, { level: 'info', message: 'nothing to remove (no unused keys after filters).' });
  }

  return {
    payload,
    issues,
    writePlan,
    sourceLeaves: leaves,
    allKeyPathCount: allKeyPaths.size,
    candidateKeys: candidates,
    safeToRemove,
    excludedUncertain,
    dynamic,
    keyObservationsCount: analysis.keyObservations.length,
    stringPresenceAvailable,
    stringPresenceEvidence: stringPresence.evidence,
    localeCode,
    isTargetMode,
  };
}
