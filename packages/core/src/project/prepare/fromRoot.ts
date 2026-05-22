import {
  ISSUE_PROJECT_UPLOAD_CONFIG_REQUIRED,
  ISSUE_SHARE_PREPARE_ANALYSIS_FAILED,
} from '../../shared/constants/issueCodes.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { PrepareProjectSnapshotResult } from '../../types/project/prepare.js';
import type { PrepareProjectSnapshotFromRootInput } from '../../types/project/prepareRoot.js';
import { normalizeProjectConfig } from '../normalizeConfig.js';
import { applyProjectAnalysisToSnapshot, resolveShareProjectAnalysis } from './fromAnalysis.js';
import { buildProjectSnapshotShellFromContext } from './snapshotShell.js';
import { buildHostPrepareCacheMeta } from '../hostPrepareCache.js';
import { createPrepareTimer } from './timing.js';

function toIssue(code: string, message: string): Issue {
  return { severity: 'error', code, message };
}

/**
 * Primary host prepare: one {@link resolveShareProjectAnalysis} pass, then snapshot extraction fields (cache-aware on CLI).
 */
export async function prepareProjectSnapshotFromRoot(
  input: PrepareProjectSnapshotFromRootInput,
): Promise<PrepareProjectSnapshotResult> {
  const timer = createPrepareTimer();
  const host = input.prepareHost ?? 'cli-share';

  const shell = buildProjectSnapshotShellFromContext({
    ctx: input.ctx,
    projectRoot: input.projectRoot,
    projectId: input.projectId,
    projectHash: input.projectHash,
  });
  if (!shell.ok) return { ok: false, issues: shell.issues };

  const { snapshot, textFiles } = shell.parsed;
  if (input.requestReceivedAt) snapshot.requestReceivedAt = input.requestReceivedAt;

  const normalized = normalizeProjectConfig(snapshot.resolvedConfig);
  if (!normalized) {
    return {
      ok: false,
      issues: [
        toIssue(
          ISSUE_PROJECT_UPLOAD_CONFIG_REQUIRED,
          'Config required with locales.source, locales.directory, src, and functions[].',
        ),
      ],
    };
  }

  timer.mark('zipParsed');

  const analysis = resolveShareProjectAnalysis(input.ctx, {
    emit: input.analysisOpts?.emit,
    runId: input.analysisOpts?.runId,
    op: 'share',
  });
  timer.mark('analysisDone');

  try {
    await applyProjectAnalysisToSnapshot({
      snapshot,
      textFiles,
      analysis,
      normalized,
      ctx: input.ctx,
      projectRoot: input.projectRoot,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to apply project analysis to snapshot';
    return { ok: false, issues: [toIssue(ISSUE_SHARE_PREPARE_ANALYSIS_FAILED, message)] };
  }

  timer.mark('extractionDone');

  const prepareMeta = timer.finish(host);
  prepareMeta.hostCache = buildHostPrepareCacheMeta(input.ctx, analysis, prepareMeta);

  return {
    ok: true,
    parsed: shell.parsed,
    prepareMeta,
  };
}
