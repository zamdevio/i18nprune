import {
  buildCliJsonEnvelope,
  buildHostedProjectShareArtifacts,
  buildHostedReportShareArtifacts,
  hex16Id,
  ISSUE_SHARE_REMOTE_ERROR,
  prepareShareHostedFromContext,
  runShare,
  stringifyEnvelope,
  type Issue,
  type ShareRunShareJsonSession,
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
import { buildReportEnvironmentSnapshot } from '@/commands/report/build.js';
import { CLI_VERSION } from '@/constants/cli.js';
import {
  emitShareUploadHumanMessages,
  ISSUE_SHARE_STALE_CACHE_ROW_REMOVED,
  type RunOptions,
  type ShareUploadJsonPayload,
  type ShareUploadOptions,
} from '@i18nprune/core';
import { buildShareHostHooks } from './hooks.js';
import { promptShareKind } from './prompts.js';
import { resolveCliShareWorkerBaseUrl } from './worker/url.js';

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
  if (opts.project && opts.report && opts.from) {
    return 'Pass --from only with --report alone (not with --project).';
  }
  if (opts.project && opts.report) return '';
  return json
    ? 'Pass --project or --report when using --json (interactive select is not available).'
    : 'Pass --project or --report (or run in a TTY to choose interactively).';
}

async function resolveShareKind(opts: ShareUploadOptions, run: RunOptions): Promise<'project' | 'report' | 'both' | null> {
  if (opts.project && opts.report) return 'both';
  if (opts.project) return 'project';
  if (opts.report) return 'report';
  if (run.json) return null;
  if (canAsk(run)) return promptShareKind();
  return null;
}

function emitUploadJsonEnvelope(
  payload: ShareUploadJsonPayload,
  input: { ok: boolean; issues: Issue[]; cwd: string },
): void {
  console.log(stringifyEnvelope(buildCliJsonEnvelope('share', payload, input)));
  applyCliCiExitGate(input.ok);
}

function shareReportHost(ctx: Awaited<ReturnType<typeof resolveContext>>) {
  return {
    cwd: ctx.adapters.system.cwd(),
    toolVersion: CLI_VERSION,
    environment: buildReportEnvironmentSnapshot(ctx.adapters.fs),
  };
}

function mergeUploadIssues(...groups: Issue[][]): Issue[] {
  return groups.flat();
}

function uploadOk(res: { issues: Issue[] }): boolean {
  return !res.issues.some((i) => i.severity === 'error');
}

export async function shareUpload(opts: ShareUploadOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctxEarly = await resolveContext();
    const json = ctxEarly.run.json;
    const shareKind = await resolveShareKind(opts, ctxEarly.run);
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

    if (shareKind === 'project' || shareKind === 'both') {
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
    const shareJsonSession: ShareRunShareJsonSession = { shareFile: { version: 1, entries: [] } };
    const hooks = { ...buildShareHostHooks(ctx, workerBaseUrl), shareJsonSession };

    if (shareKind === 'both') {
      const hosted = await prepareShareHostedFromContext({
        ctx: coreCtx,
        projectRoot,
        projectId: hex16Id(),
        projectHash: '0'.repeat(64),
        wantProject: true,
        wantReport: true,
        prepareHost: 'cli-share',
        reportHost: shareReportHost(ctx),
        analysisOpts: { emit: hooks.emit, runId: hooks.runId },
      });
      if (!hosted.ok) {
        if (json) {
          emitUploadJsonEnvelope(emptyUploadPayload('project'), {
            ok: false,
            issues: hosted.issues,
            cwd: ctx.adapters.system.cwd(),
          });
          return;
        }
        for (const issue of hosted.issues) {
          if (issue.severity === 'warning') logger.warn(issue.message, ctx.run);
          else logger.err(issue.message);
        }
        printCommandSummary(
          { command: 'share upload', ok: false, durationMs: wall.elapsedMs(), counts: {}, issues: hosted.issues },
          ctx,
        );
        applyCliCiExitGate(false);
        return;
      }

      const projectBuilt = await buildHostedProjectShareArtifacts({
        ctx: coreCtx,
        prepare: hosted.project!,
        processorContext: hooks.processorContext,
      });
      if (!projectBuilt.ok) {
        if (json) {
          emitUploadJsonEnvelope(emptyUploadPayload('project'), {
            ok: false,
            issues: projectBuilt.issues,
            cwd: ctx.adapters.system.cwd(),
          });
          return;
        }
        for (const issue of projectBuilt.issues) logger.err(issue.message);
        printCommandSummary(
          { command: 'share upload', ok: false, durationMs: wall.elapsedMs(), counts: {}, issues: projectBuilt.issues },
          ctx,
        );
        applyCliCiExitGate(false);
        return;
      }
      const reportArtifacts = buildHostedReportShareArtifacts(hosted.report!);

      const projectRes = await runShare({
        ctx: coreCtx,
        projectRoot,
        workerBaseUrl,
        kind: 'project',
        source: 'build',
        force: Boolean(opts.force),
        hooks,
        prepared: {
          envelope: projectBuilt.envelope,
          serialized: projectBuilt.serialized,
          manifest: projectBuilt.manifest,
        },
      });
      const reportRes = await runShare({
        ctx: coreCtx,
        projectRoot,
        workerBaseUrl,
        kind: 'report',
        source: 'document',
        reportDocument: reportArtifacts.document,
        force: Boolean(opts.force),
        hooks,
        prepared: reportArtifacts,
      });

      const issues = mergeUploadIssues(projectRes.issues, reportRes.issues);
      const ok = uploadOk(projectRes) && uploadOk(reportRes);

      if (json) {
        const payload: ShareUploadJsonPayload = {
          kind: 'share',
          shareKind: 'project',
          action: projectRes.action,
          manifest: projectRes.manifest,
          links: { ...projectRes.links, ...reportRes.links },
          workerIds: { ...projectRes.workerIds, ...reportRes.workerIds },
          skippedReason: projectRes.skippedReason ?? reportRes.skippedReason,
          cacheEntry: projectRes.cacheEntry ?? reportRes.cacheEntry,
          workerExpiresAt: projectRes.workerExpiresAt ?? reportRes.workerExpiresAt,
          workerDeduped: projectRes.workerDeduped || reportRes.workerDeduped,
        };
        emitUploadJsonEnvelope(payload, { ok, issues, cwd: ctx.adapters.system.cwd() });
        return;
      }

      for (const issue of issues) {
        if (issue.code === ISSUE_SHARE_STALE_CACHE_ROW_REMOVED) continue;
        if (issue.severity === 'warning') logger.warn(issue.message, ctx.run);
        else if (issue.severity === 'error') logger.err(issue.message);
      }
      emitShareUploadHumanMessages(hooks, projectRes);
      emitShareUploadHumanMessages(hooks, reportRes);
      const summaryIssues = issues.filter((i) => i.code !== ISSUE_SHARE_STALE_CACHE_ROW_REMOVED);
      printCommandSummary(
        { command: 'share upload', ok, durationMs: wall.elapsedMs(), counts: {}, issues: summaryIssues },
        ctx,
      );
      applyCliCiExitGate(ok);
      return;
    }

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

    const ok = uploadOk(res);
    const payload: ShareUploadJsonPayload = {
      kind: 'share',
      shareKind,
      action: res.action,
      manifest: res.manifest,
      links: res.links,
      workerIds: res.workerIds,
      skippedReason: res.skippedReason,
      cacheEntry: res.cacheEntry,
      ...(res.workerExpiresAt ? { workerExpiresAt: res.workerExpiresAt } : {}),
      ...(res.workerDeduped ? { workerDeduped: res.workerDeduped } : {}),
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
