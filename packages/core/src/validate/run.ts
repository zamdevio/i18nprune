import type { ProjectAnalysis } from '../analysis/project.js';
import { resolveProjectAnalysis } from '../analysis/index.js';
import { scanProjectDynamicKeySites } from '../extractor/dynamic/orchestrate.js';
import { scanProjectKeyObservations } from '../extractor/keySites/orchestrate.js';
import { literalKeyUsageFromObservations } from '../extractor/keySites/projectUsage.js';
import { readFlatLocaleJsonSurface } from '../shared/locales/read/flatFileSurface.js';
import { ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED } from '../shared/constants/issueCodes.js';
import { issueCodeRepoDocPathForIssueCode } from '../shared/docs/issueAnchors.js';
import { emitRunEvent, nowMs } from '../shared/run/index.js';
import {
  detectSourcePlaceholderLeaves,
  issuesFromSourcePlaceholderLeaves,
  sourcePlaceholderValues,
} from '../shared/sourcePlaceholders/index.js';
import type { CoreContext } from '../types/generate/index.js';
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
  const localeRead = readFlatLocaleJsonSurface({
    fs: ctx.adapters.fs,
    path: ctx.adapters.path,
    absoluteFile: sourcePath,
    localesDir: ctx.paths.localesDir,
  });
  if (!localeRead.ok) {
    const keyObservations = scanProjectKeyObservations(scanInputEarly);
    const dynamicSites = scanProjectDynamicKeySites(scanInputEarly);
    const analysis: ProjectAnalysis = {
      version: 1,
      keyObservations,
      dynamicSites,
      usage: literalKeyUsageFromObservations(keyObservations),
    };
    const message =
      localeRead.diagnostics.map((d) => d.message).join(' · ') || 'failed to read source locale JSON';
    return readFailureResult(ctx, new Error(message), analysis);
  }
  const raw = localeRead.document;

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
    sourceLocaleJson: raw,
    resolvedKeys: usage.resolvedKeys,
    keyObservations,
    dynamicSites,
  });
  const issues: Issue[] = [
    ...buildValidateIssues({
      missingCount: data.missing.length,
      dynamicSiteCount: dynamicSites.length,
      sourceLocalePath: sourcePath,
    }),
    ...issuesFromSourcePlaceholderLeaves(
      detectSourcePlaceholderLeaves(
        localeRead.leaves,
        sourcePlaceholderValues(ctx.config.missing?.placeholder),
      ),
    ),
  ];

  return {
    payload: data,
    issues,
    fullDynamicSites: dynamicSites,
    fullKeyObservations: keyObservations,
  };
}
