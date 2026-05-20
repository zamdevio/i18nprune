import { select } from '@inquirer/prompts';
import {
  buildCliJsonEnvelope,
  getRunOptions,
  ISSUE_SHARE_REMOTE_ERROR,
  runShare,
  stringifyEnvelope,
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
  type ShareUploadJsonPayload,
  type ShareUploadOptions,
} from '@i18nprune/core';
import { buildShareHostHooks } from './hooks.js';
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

async function resolveShareKind(opts: ShareUploadOptions): Promise<'project' | 'report' | null> {
  if (opts.project && opts.report) return null;
  if (opts.project) return 'project';
  if (opts.report) return 'report';
  if (canAsk()) {
    return select<'project' | 'report'>({
      message: 'What do you want to share?',
      choices: [
        { name: 'Project snapshot (zip upload)', value: 'project' },
        { name: 'Report JSON (stored report link)', value: 'report' },
      ],
    });
  }
  return null;
}

export async function shareUpload(opts: ShareUploadOptions): Promise<void> {
  const wall = attachWallTimer();
  const shareKind = await resolveShareKind(opts);
  if (!shareKind) {
    const message =
      opts.project && opts.report
        ? 'Pass only one of --project or --report.'
        : 'Pass --project or --report (or run in a TTY to choose interactively).';
    const json = getRunOptions().json;
    if (json) {
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('share', emptyUploadPayload('project'), {
            ok: false,
            issues: [{ severity: 'error', code: ISSUE_SHARE_REMOTE_ERROR, message }],
            cwd: process.cwd(),
          }),
        ),
      );
      applyCliCiExitGate(false);
      return;
    }
    logger.err(message);
    process.exitCode = 1;
    return;
  }

  const ctx = await resolveContext();
  const workerBaseUrl = resolveCliShareWorkerBaseUrl(opts.workerUrl);

  if (shareKind === 'project') {
    const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'validate' });
    if (readiness) {
      if (ctx.run.json) {
        console.log(
          stringifyEnvelope(
            buildCliJsonEnvelope('share', emptyUploadPayload('project'), {
              ok: false,
              issues: readiness,
              cwd: ctx.adapters.system.cwd(),
            }),
          ),
        );
        applyCliCiExitGate(false);
        return;
      }
      if (readiness[0]) logger.warn(readiness[0].message, ctx.run);
      printCommandSummary(
        {
          command: 'share',
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

  if (ctx.run.json) {
    console.log(
      stringifyEnvelope(
        buildCliJsonEnvelope('share', payload, {
          ok,
          issues: res.issues,
          cwd: ctx.adapters.system.cwd(),
        }),
      ),
    );
    applyCliCiExitGate(ok);
    return;
  }

  for (const issue of res.issues) {
    if (issue.severity === 'warning') logger.warn(issue.message, ctx.run);
    else if (issue.severity === 'error') logger.err(issue.message);
  }
  emitShareUploadHumanMessages(hooks, res);
  printCommandSummary(
    {
      command: 'share',
      ok,
      durationMs: wall.elapsedMs(),
      counts: {},
      issues: res.issues,
    },
    ctx,
  );
  applyCliCiExitGate(ok);
}
