import { applyCleanupKeysToLocaleJson } from './apply.js';
import { computeCleanupCandidateKeys } from './candidates.js';
import { resolveCleanupKeysWithStringPresencePolicy } from './stringPresence.js';
import { readJsonFromRuntimeFsSync } from '../runtime/helpers/sync/readJson.js';
import { writeRuntimeJsonPretty } from '../generate/io/writeRuntimeJson.js';
import { collectTranslationSurfaceLeaves } from '../shared/localeLeaves/index.js';
import { resolveReferenceConfig } from '../shared/reference/resolveConfig.js';
import { buildKeyReferenceContextFromLiteralUsageAndDynamicSites } from '../shared/reference/context.js';
import { emitRunMessage } from '../shared/run/index.js';
import {
  ISSUE_CLEANUP_RIPGREP_UNAVAILABLE,
  ISSUE_CLEANUP_UNCERTAIN_PATHS_EXCLUDED,
  ISSUE_SCAN_DYNAMIC_KEY_SITES,
} from '../shared/constants/issueCodes.js';
import type { CoreContext } from '../types/generate/index.js';
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
  const sourcePath = ctx.paths.sourceLocale;
  const sourceJson = readJsonFromRuntimeFsSync(sourcePath, ctx.adapters.fs);
  const applied = applyCleanupKeysToLocaleJson(sourceJson, keysToRemove);
  return {
    sourcePath,
    keys: [...keysToRemove],
    nextSourceJson: applied.next,
    removedPaths: applied.removedPaths,
  };
}

export function writeCleanupPlan(ctx: CoreContext, plan: CleanupWritePlan): void {
  if (plan.removedPaths.length === 0) return;
  writeRuntimeJsonPretty(plan.sourcePath, plan.nextSourceJson, ctx.adapters);
}

export function emitCleanupCheckOnlyMessage(
  host: Pick<CleanupHostHooks, 'emit' | 'runId'>,
  removeCount: number,
): void {
  emitCleanupMessage(host, {
    level: 'info',
    message: `Would remove ${String(removeCount)} unused path(s) (check-only)`,
    data: { removeCount },
  });
}

export function emitCleanupAbortMessage(
  host: Pick<CleanupHostHooks, 'emit' | 'runId'>,
  reason: 'no_keys_approved' | 'declined_confirmation',
): void {
  emitCleanupMessage(host, {
    level: 'info',
    message:
      reason === 'no_keys_approved'
        ? 'aborted (no keys approved for removal).'
        : 'aborted (no files changed).',
    data: { reason },
  });
}

export function emitCleanupAskIgnoredMessage(host: Pick<CleanupHostHooks, 'emit' | 'runId'>): void {
  emitCleanupMessage(host, { level: 'info', message: '--ask ignored (not an interactive terminal).' });
}

export function emitCleanupWriteIntro(
  host: Pick<CleanupHostHooks, 'emit' | 'runId'>,
  removeCount: number,
): void {
  emitCleanupMessage(host, {
    level: 'warn',
    message: `removing ${String(removeCount)} path(s) from source locale file. Run \`i18nprune sync\` afterwards to align target locale files.`,
    data: { removeCount },
  });
}

export function emitCleanupWriteDone(
  host: Pick<CleanupHostHooks, 'emit' | 'runId'>,
  input: { plan: CleanupWritePlan; wrote: boolean },
): void {
  if (input.wrote) {
    emitCleanupMessage(host, {
      level: 'detail',
      message: `wrote ${input.plan.sourcePath}`,
      path: input.plan.sourcePath,
    });
  }
  emitCleanupMessage(host, {
    level: 'info',
    message: `finished — ${input.wrote ? '1' : '0'} source locale file(s) updated on disk.`,
    data: { filesWritten: input.wrote ? 1 : 0 },
  });
}

export function runCleanup(
  ctx: CoreContext,
  opts: CleanupRunOptions,
  host: CleanupHostHooks,
): CleanupRunResult {
  emitCleanupMessage(host, { level: 'info', message: 'scanning source locale and project sources for unused key paths...' });

  const eff = resolveReferenceConfig('cleanup', ctx.config);
  const referenceData = host.loadReferenceData();
  const dynamicSites = [...referenceData.dynamicSites];
  const refCtx = buildKeyReferenceContextFromLiteralUsageAndDynamicSites(
    referenceData.usage,
    dynamicSites,
    eff,
  );
  const sourcePath = ctx.paths.sourceLocale;
  const sourceRaw = readJsonFromRuntimeFsSync(sourcePath, ctx.adapters.fs);
  const leaves = collectTranslationSurfaceLeaves(sourceRaw);
  const filterUncertain = eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only';
  const { allKeyPaths, candidates, excludedUncertain } = computeCleanupCandidateKeys({
    leaves,
    usage: referenceData.usage,
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

  if (dynamicSites.length > 0) {
    emitCleanupMessage(host, {
      level: 'warn',
      message: `${String(dynamicSites.length)} translation call(s) use a non-literal key — cleanup literal-key inference may miss usage; tighten \`reference\` uncertain-key rules or inspect \`i18nprune validate\` / \`locales dynamic\`.`,
      data: { dynamicKeySites: dynamicSites.length },
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
  });

  for (const ev of stringPresence.evidence) {
    const hint = ev.locations.join(', ');
    emitCleanupMessage(host, {
      level: 'detail',
      message:
        ev.kind === 'guard_skipped'
          ? `cleanup: skipping key (string presence in src — not proof of static key): ${ev.key}${hint ? ` — e.g. ${hint}` : ''}`
          : `cleanup: string presence in src (removal still allowed — reference.stringPresence=warn): ${ev.key}${hint ? ` — ${hint}` : ''}`,
      data: { key: ev.key, kind: ev.kind },
    });
  }

  const safeToRemove = stringPresence.safeToRemove;
  const writePlan = createCleanupSourceWritePlan(ctx, safeToRemove);
  const issues = [
    ...issuesFromDynamicScanCount(dynamicSites.length),
    ...issuesFromCleanupUncertainExcluded(excludedUncertain),
    ...issuesFromCleanupStringPresenceUnavailable({ skipStringPresenceCheck, stringPresenceAvailable }),
  ];
  const payload = {
    wouldRemove: safeToRemove.length,
    keys: safeToRemove,
    dynamicKeySites: dynamicSites.length,
    uncertainPrefixes: refCtx.uncertainPrefixes,
  };

  if (opts.checkOnly || opts.dryRun) {
    emitCleanupCheckOnlyMessage(host, safeToRemove.length);
  } else if (safeToRemove.length === 0) {
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
    dynamicSites,
    stringPresenceAvailable,
    stringPresenceEvidence: stringPresence.evidence,
  };
}
