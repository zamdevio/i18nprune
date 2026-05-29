import { resolveProjectAnalysis } from '../analysis/index.js';
import type { ProjectAnalysis } from '../types/analysis/index.js';
import { scanProjectDynamicKeySites } from '../extractor/dynamic/orchestrate.js';
import { scanProjectKeyObservations } from '../extractor/keySites/orchestrate.js';
import { literalKeyUsageFromObservations } from '../extractor/keySites/projectUsage.js';
import { readSourceLocaleLeaves } from '../shared/locales/surface/localeSurface.js';
import { ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED } from '../shared/constants/issueCodes.js';
import { issueCodeRepoDocPathForIssueCode } from '../shared/docs/issueAnchors.js';
import { emitRunEvent, emitRunMessage, nowMs } from '../shared/run/index.js';
import {
  detectSourcePlaceholderLeaves,
  formatSourcePlaceholderMessage,
  issuesFromSourcePlaceholderLeaves,
  sourcePlaceholderValues,
} from '../shared/sourcePlaceholders/index.js';
import type { CoreContext } from '../types/context/index.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { ValidateHostHooks, ValidateRunOptions, ValidateRunResult } from '../types/validate/index.js';
import { buildValidateIssues } from './issues.js';
import { buildValidateScanPayload } from './buildPayload.js';

function emptyValidatePayload(): ValidateRunResult['payload'] {
  return {
    missing: [],
    count: 0,
    dynamic: { count: 0 },
    keyObservations: { count: 0 },
  };
}

function readFailureResult(ctx: CoreContext, err: unknown, analysis: ProjectAnalysis): ValidateRunResult {
  const message = err instanceof Error ? err.message : String(err);
  const readIssue: Issue = {
    severity: 'error',
    code: ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED,
    message,
    path: ctx.paths.sourceLocale,
    docPath: issueCodeRepoDocPathForIssueCode(ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED),
  };
  return {
    payload: emptyValidatePayload(),
    issues: [readIssue],
    fullDynamicSites: analysis.dynamicSites,
    fullKeyObservations: analysis.keyObservations,
  };
}

/**
 * Compare resolved literal keys from project analysis to string leaves in the source locale JSON.
 * Uses {@link resolveProjectAnalysis} so caching matches other project ops (`quality`, `review`, …).
 */
export function runValidate(ctx: CoreContext, _opts: ValidateRunOptions, host: ValidateHostHooks): ValidateRunResult {
  const emit = host.emit;
  const runId = host.runId;
  const sourcePath = ctx.paths.sourceLocale;

  emitRunEvent(emit, {
    type: 'run.progress.validate',
    op: 'validate',
    runId,
    at: nowMs(),
    phase: 'read_source',
    label: sourcePath,
  });

  const scanInputEarly = {
    srcRoot: ctx.paths.srcRoot,
    functions: ctx.config.functions,
    runtime: ctx.adapters,
    exclude: ctx.config.exclude,
  };
  let sourceLeaves;
  try {
    sourceLeaves = readSourceLocaleLeaves(ctx);
  } catch (err: unknown) {
    const keyObservations = scanProjectKeyObservations(scanInputEarly);
    const dynamicSites = scanProjectDynamicKeySites(scanInputEarly);
    const analysis: ProjectAnalysis = {
      version: 1,
      keyObservations,
      dynamicSites,
      missingKeys: [],
      counts: {
        keyObservations: keyObservations.length,
        dynamicSites: dynamicSites.length,
        sourceFilesScanned: 0,
        missingKeys: 0,
      },
      usage: literalKeyUsageFromObservations(keyObservations),
    };
    return readFailureResult(ctx, err, analysis);
  }

  emitRunEvent(emit, { type: 'run.progress.validate', op: 'validate', runId, at: nowMs(), phase: 'scan_sources' });
  const analysis = resolveProjectAnalysis(ctx, { emit, op: 'validate', runId });
  const { keyObservations, dynamicSites, usage } = analysis;

  emitRunEvent(emit, {
    type: 'run.progress.validate',
    op: 'validate',
    runId,
    at: nowMs(),
    phase: 'extract_keys',
    current: keyObservations.length,
    total: keyObservations.length,
  });
  emitRunEvent(emit, {
    type: 'run.progress.validate',
    op: 'validate',
    runId,
    at: nowMs(),
    phase: 'compare',
    current: usage.resolvedKeys.size,
    total: usage.resolvedKeys.size,
  });

  const data = buildValidateScanPayload({
    sourceLocaleLeaves: sourceLeaves,
    resolvedKeys: usage.resolvedKeys,
    keyObservations,
    dynamicSites,
  });
  const sourcePlaceholderLeaves = detectSourcePlaceholderLeaves(
    sourceLeaves,
    sourcePlaceholderValues(ctx.config.missing?.placeholder),
  );
  if (sourcePlaceholderLeaves.length > 0) {
    emitRunMessage(host.emit, {
      op: 'validate',
      runId,
      level: 'warn',
      message: formatSourcePlaceholderMessage({
        count: sourcePlaceholderLeaves.length,
        samplePaths: sourcePlaceholderLeaves.slice(0, 5).map((leaf) => leaf.path),
      }),
      data: { sourcePlaceholderLeaves: sourcePlaceholderLeaves.length },
    });
  }
  const issues: Issue[] = [
    ...buildValidateIssues({
      missingCount: data.missing.length,
      dynamicSiteCount: dynamicSites.length,
      sourceLocalePath: sourcePath,
    }),
    ...issuesFromSourcePlaceholderLeaves(sourcePlaceholderLeaves),
  ];

  return {
    payload: data,
    issues,
    fullDynamicSites: dynamicSites,
    fullKeyObservations: keyObservations,
  };
}
