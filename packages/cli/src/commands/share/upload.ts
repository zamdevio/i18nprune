import {
  buildCliJsonEnvelope,
  ISSUE_SHARE_REMOTE_ERROR,
  runShare,
  stringifyEnvelope,
  type Issue,
} from '@i18nprune/core';
import { resolveContext } from '@/shared/context/index.js';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { resolvePatchingProjectRoot } from '@/shared/patching/scaffoldI18nLayout.js';
import { printCommandSummary } from '@/output/index.js';
import { logger } from '@/utils/logger/index.js';
import { canAsk } from '@/shared/ask/gate.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { runReportOperation } from '@/commands/report/buildEnvelope.js';
import {
  emitShareUploadHumanMessages,
  ISSUE_SHARE_STALE_CACHE_ROW_REMOVED,
  type ShareUploadJsonPayload,
  type ShareUploadOptions,
} from '@i18nprune/core';
import { buildShareHostHooks } from './hooks.js';
import { promptShareKind } from './prompts.js';
import { resolveCliShareWorkerBaseUrl } from './workerUrl.js';

function emptyUploadPayload(shareKind: 'project' | 'report'): ShareUploadJsonPayload {
  return {
    kind: 'share',
    shareKind,
    action: 'skipped',
    links: {},
    workerIds: {},
  };
}

function resolveShareKindError(opts: ShareUploadOptions, json: boolean): string {
  if (opts.project && opts.report) {
    return json
      ? 'Pass only one of --project or --report when using --json.'
      : 'Pass only one of --project or --report.';
  }
  return json
    ? 'Pass --project or --report when using --json (interactive select is not available).'
    : 'Pass --project or --report (or run in a TTY to choose interactively).';
}

async function resolveShareKind(opts: ShareUploadOptions, json: boolean): Promise<'project' | 'report' | null> {
  if (opts.project && opts.report) return null;
  if (opts.project) return 'project';
  if (opts.report) return 'report';
  if (json) return null;
  if (canAsk()) return promptShareKind();
  return null;
}

function emitUploadJsonEnvelope(
  payload: ShareUploadJsonPayload,
  input: { ok: boolean; issues: Issue[]; cwd: string },
): void {
  console.log(stringifyEnvelope(buildCliJsonEnvelope('share', payload, input)));
  applyCliCiExitGate(input.ok);
}

export async function shareUpload(opts: ShareUploadOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctxEarly = await resolveContext();
    const json = ctxEarly.run.json;
    const shareKind = await resolveShareKind(opts, json);
    if (!shareKind) {
      const message = resolveShareKindError(opts, json);
      if (json) {
        emitUploadJsonEnvelope(emptyUploadPayload('project'), {
          ok: false,
          issues: [{ severity: 'error', code: ISSUE_SHARE_REMOTE_ERROR, message }],
          cwd: ctxEarly.adapters.system.cwd(),
        });
        return;
      }
      logger.err(message);
      process.exitCode = 1;
      return;
    }

    const ctx = ctxEarly;
    const workerBaseUrl = resolveCliShareWorkerBaseUrl(opts.workerUrl);

    if (shareKind === 'project') {
      const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'validate' });
      if (readiness) {
        if (json) {
          emitUploadJsonEnvelope(emptyUploadPayload('project'), {
            ok: false,
            issues: readiness,
            cwd: ctx.adapters.system.cwd(),
          });
          return;
        }
        if (readiness[0]) logger.warn(readiness[0].message, ctx.run);
        printCommandSummary(
          {
            command: 'share upload',
            ok: false,
            durationMs: wall.elapsedMs(),
            counts: {},
            issues: readiness,
          },
          ctx,
        );
        applyCliCiExitGate(false);
        return;
      }
    }

    const coreCtx = createCliCoreContext(ctx);
    const projectRoot = resolvePatchingProjectRoot(ctx);
    const hooks = buildShareHostHooks(ctx, workerBaseUrl);

    let reportDocument: unknown;
    if (shareKind === 'report') {
      const out = await runReportOperation({ format: 'json', from: opts.from });
      reportDocument = out.envelope.data.document;
    }

    const res =
      shareKind === 'project'
        ? await runShare({
            ctx: coreCtx,
            projectRoot,
            workerBaseUrl,
            kind: 'project',
            source: 'build',
            force: Boolean(opts.force),
            hooks,
          })
        : await runShare({
            ctx: coreCtx,
            projectRoot,
            workerBaseUrl,
            kind: 'report',
            source: 'document',
            reportDocument: reportDocument!,
            force: Boolean(opts.force),
            hooks,
          });

    const ok = !res.issues.some((i) => i.severity === 'error');
    const payload: ShareUploadJsonPayload = {
      kind: 'share',
      shareKind,
      action: res.action,
      manifest: res.manifest,
      links: res.links,
      workerIds: res.workerIds,
      skippedReason: res.skippedReason,
      cacheEntry: res.cacheEntry,
    };

    if (json) {
      emitUploadJsonEnvelope(payload, {
        ok,
        issues: res.issues,
        cwd: ctx.adapters.system.cwd(),
      });
      return;
    }

    for (const issue of res.issues) {
      if (issue.code === ISSUE_SHARE_STALE_CACHE_ROW_REMOVED) continue;
      if (issue.severity === 'warning') logger.warn(issue.message, ctx.run);
      else if (issue.severity === 'error') logger.err(issue.message);
    }
    emitShareUploadHumanMessages(hooks, res);
    const summaryIssues = res.issues.filter((i) => i.code !== ISSUE_SHARE_STALE_CACHE_ROW_REMOVED);
    printCommandSummary(
      {
        command: 'share upload',
        ok,
        durationMs: wall.elapsedMs(),
        counts: {},
        issues: summaryIssues,
      },
      ctx,
    );
    applyCliCiExitGate(ok);
  } finally {
    wall.dispose();
  }
}
