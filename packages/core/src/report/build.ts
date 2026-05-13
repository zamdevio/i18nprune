import { resolveProjectAnalysis } from '../analysis/index.js';
import { computeMissingLiteralKeysFromResolvedKeys } from '../validate/missingLiterals.js';
import { listSourceFiles } from '../shared/scanner/files.js';
import { readJsonFromRuntimeFsSync } from '../runtime/helpers/sync/readJson.js';
import type { CoreContext } from '../types/generate/index.js';
import type { ReportEnvironmentSnapshot } from '../types/report/index.js';
import type { RunEmitter, OperationId } from '../types/shared/run/index.js';

export type BuildReportDocumentInput = {
  environment: ReportEnvironmentSnapshot;
  cwd: string;
  toolVersion: string;
  emit?: RunEmitter;
  runId?: string;
};

const REPORT_OP: OperationId = 'report';
const PROJECT_REPORT_KIND = 'i18nprune.projectReport' as const;
const PROJECT_REPORT_SCHEMA_VERSION = 1 as const;

/**
 * Build a `ProjectReportDocument` from live project analysis.
 *
 * Pure orchestration over core primitives (`resolveProjectAnalysis`,
 * `computeMissingLiteralKeysFromResolvedKeys`, `listSourceFiles`).
 * Environment facts come from `input` — no `process.*` or `os.*` access.
 */
export function buildReportDocument(
  ctx: CoreContext,
  input: BuildReportDocumentInput,
): { document: Record<string, unknown>; dynamicSitesCount: number } {
  const raw = readJsonFromRuntimeFsSync(ctx.paths.sourceLocale, ctx.adapters.fs);
  const analysis = resolveProjectAnalysis(ctx, {
    emit: input.emit,
    op: REPORT_OP,
    runId: input.runId,
  });
  const { keyObservations, dynamicSites, usage } = analysis;
  const missing = computeMissingLiteralKeysFromResolvedKeys(raw, usage.resolvedKeys);
  const projectFs = { fs: ctx.adapters.fs, path: ctx.adapters.path };
  const sourceFilesScannedCount = listSourceFiles(projectFs, ctx.paths.srcRoot, ctx.config.exclude).length;
  const sourceLocaleTag = ctx.adapters.path.basename(ctx.paths.sourceLocale, '.json');

  const document: Record<string, unknown> = {
    kind: PROJECT_REPORT_KIND,
    schemaVersion: PROJECT_REPORT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    toolVersion: input.toolVersion,
    project: {
      cwd: input.cwd,
      sourceLocalePath: ctx.paths.sourceLocale,
      localesDir: ctx.paths.localesDir,
      srcRoot: ctx.paths.srcRoot,
      sourceLocaleTag,
      environment: {
        platform: input.environment.platform,
        arch: input.environment.arch,
        nodeVersion: input.environment.nodeVersion,
        osRelease: input.environment.osRelease,
        ...(input.environment.distro !== undefined ? { distro: input.environment.distro } : {}),
        runtimeFamily: input.environment.runtimeFamily,
        ...(input.environment.wslDistroName !== undefined
          ? { wslDistroName: input.environment.wslDistroName }
          : {}),
      },
    },
    summary: {
      missingKeysCount: missing.length,
      dynamicSitesCount: dynamicSites.length,
      keyObservationsCount: keyObservations.length,
      sourceFilesScannedCount,
      ok: missing.length === 0,
    },
    details: {
      missingKeys: missing,
      dynamicSites: dynamicSites as unknown[],
      keyObservations: keyObservations as unknown[],
    },
  };

  return { document, dynamicSitesCount: dynamicSites.length };
}
