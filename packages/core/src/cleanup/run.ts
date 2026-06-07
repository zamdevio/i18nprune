import { applyCleanupKeysToLocaleJson } from './apply.js';
import { computeCleanupCandidateKeys } from './candidates.js';
import { resolveCleanupKeysWithStringPresencePolicy } from './stringPresence.js';
import { readLocaleJsonFromContextSync, writeLocaleJsonFromContextSync } from '../shared/locales/index.js';
import {
  listCleanupSourceSegmentsForKeys,
  readCleanupSourceLeaves,
} from './sourceSurface.js';
import { resolveReferenceConfig } from '../shared/reference/resolveConfig.js';
import { buildKeyReferenceContextFromLiteralUsageAndDynamicSites } from '../shared/reference/context.js';
import { resolveProjectAnalysis } from '../analysis/index.js';
import { emitRunMessage } from '../shared/run/index.js';
import { finalizeLocaleSuggestions } from '../suggestions/index.js';
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
    data?: Record<string, string | number | boolean | null>;
    path?: string;
  },
): void {
  emitRunMessage(host.emit, { op: 'cleanup', runId: host.runId, ...input });
}

export function createCleanupSourceWritePlan(
  ctx: CoreContext,
  keysToRemove: readonly string[],
): CleanupWritePlan {
  const writes = listCleanupSourceSegmentsForKeys(ctx, keysToRemove).flatMap((segment) => {
    const sourceJson = readLocaleJsonFromContextSync(ctx, segment.absolutePath);
    const applied = applyCleanupKeysToLocaleJson(sourceJson, keysToRemove);
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
  return {
    writes,
    keys: [...keysToRemove],
    sourcePath: primary?.sourcePath ?? ctx.paths.sourceLocale,
    nextSourceJson: primary?.nextSourceJson ?? readLocaleJsonFromContextSync(ctx, ctx.paths.sourceLocale),
    removedPaths,
  };
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
  input: { removeCount: number; segmentFileCount: number },
): void {
  const fileHint =
    input.segmentFileCount > 1
      ? `${String(input.segmentFileCount)} source segment file(s)`
      : 'source locale file';
  emitCleanupMessage(host, {
    level: 'warn',
    message: `removing ${String(input.removeCount)} path(s) from ${fileHint}. Run \`i18nprune sync\` afterwards to align target locale files.`,
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
    message: `finished — ${String(filesWritten)} source locale file(s) updated on disk.`,
    data: { filesWritten },
  });
}

export function runCleanup(
  ctx: CoreContext,
  opts: CleanupRunOptions,
  host: CleanupHostHooks,
): CleanupRunResult {
  emitCleanupMessage(host, { level: 'info', message: 'scanning source locale and project sources for unused key paths...' });

  const eff = resolveReferenceConfig('cleanup', ctx.config);
  const analysis = resolveProjectAnalysis(ctx, { emit: host.emit, op: 'cleanup', runId: host.runId });
  const dynamic = analysis.dynamicSites;
  const refCtx = buildKeyReferenceContextFromLiteralUsageAndDynamicSites(
    analysis.usage,
    dynamic,
    eff,
  );
  const leaves = readCleanupSourceLeaves(ctx);
  const filterUncertain = eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only';
  const { allKeyPaths, candidates, excludedUncertain } = computeCleanupCandidateKeys({
    leaves,
    usage: analysis.usage,
    preserve: ctx.config.policies?.preserve,
    uncertainPrefixes: refCtx.uncertainPrefixes,
    filterUncertainPrefixes: filterUncertain,
  });

  if (excludedUncertain > 0) {
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
    message: `${String(allKeyPaths.size)} key path(s) in source JSON · ${String(candidates.length)} unused candidate(s) after preserve / reference rules`,
    data: { keyPaths: allKeyPaths.size, candidates: candidates.length },
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

  for (const ev of stringPresence.evidence) {
    const hint = ev.locations.join(', ');
    emitCleanupMessage(host, {
      level: 'detail',
      message:
        ev.kind === 'guard_skipped'
          ? `cleanup: skipping key (probe text still in src — not proof of static key usage): ${ev.key}${hint ? ` — e.g. ${hint}` : ''}`
          : `cleanup: probe text in src (removal still allowed — reference.stringPresence=warn): ${ev.key}${hint ? ` — ${hint}` : ''}`,
      data: { key: ev.key, kind: ev.kind },
    });
  }

  const safeToRemove = stringPresence.safeToRemove;
  const writePlan = createCleanupSourceWritePlan(ctx, safeToRemove);
  const issues = [
    ...issuesFromDynamicScanCount(dynamic.length),
    ...issuesFromCleanupUncertainExcluded(excludedUncertain),
    ...issuesFromCleanupStringPresenceUnavailable({ skipStringPresenceCheck, stringPresenceAvailable }),
  ];
  const payload = finalizeLocaleSuggestions(host, {
    op: 'cleanup',
    ctx,
    analysis,
    dryRun: opts.dryRun,
  }, {
    wouldRemove: safeToRemove.length,
    keys: safeToRemove,
    dynamic: dynamic.length,
    uncertainPrefixes: refCtx.uncertainPrefixes,
  });

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
  };
}
