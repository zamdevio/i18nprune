import { select } from '@inquirer/prompts';
import {
  buildCliJsonEnvelope,
  ISSUE_SHARE_REMOTE_ERROR,
  runShareList,
  runShareView,
  stringifyEnvelope,
} from '@i18nprune/core';
import { resolveContext } from '@/shared/context/index.js';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { printCommandSummary } from '@/output/index.js';
import { logger } from '@/utils/logger/index.js';
import { canAsk } from '@/shared/ask/gate.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import {
  emitShareViewHumanMessages,
  type ShareCacheEntry,
  type ShareKind,
  type ShareViewJsonPayload,
  type ShareViewOptions,
} from '@i18nprune/core';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import { createShareWorkerHooks } from './workerHttp.js';
import { resolveCliShareWorkerBaseUrl } from './workerUrl.js';
import { randomUUID } from 'node:crypto';

async function resolveViewTarget(
  opts: ShareViewOptions,
  entries: ShareCacheEntry[],
): Promise<{ kind: ShareKind; workerId: string; workerBaseUrl: string } | null> {
  if (opts.project && opts.report) return null;
  if (opts.project) {
    return {
      kind: 'project',
      workerId: opts.project,
      workerBaseUrl: resolveCliShareWorkerBaseUrl(opts.workerUrl),
    };
  }
  if (opts.report) {
    return {
      kind: 'report',
      workerId: opts.report,
      workerBaseUrl: resolveCliShareWorkerBaseUrl(opts.workerUrl),
    };
  }
  if (!canAsk() || entries.length === 0) return null;
  const picked = await select<ShareCacheEntry>({
    message: 'Select a cached share entry',
    choices: entries.map((e) => {
      const id = e.kind === 'project' ? e.workerProjectId : e.workerReportId;
      return {
        name: `${e.kind} ${id ?? '?'} (${e.workerBaseUrl})`,
        value: e,
      };
    }),
  });
  const id = picked.kind === 'project' ? picked.workerProjectId : picked.workerReportId;
  if (!id) return null;
  return { kind: picked.kind, workerId: id, workerBaseUrl: picked.workerBaseUrl };
}

export async function shareView(opts: ShareViewOptions): Promise<void> {
  const wall = attachWallTimer();
  const ctx = await resolveContext();
  const coreCtx = createCliCoreContext(ctx);
  const listed = runShareList({ ctx: coreCtx });
  const target = await resolveViewTarget(opts, listed.entries);

  if (!target) {
    const message =
      opts.project && opts.report
        ? 'Pass only one of --project or --report.'
        : 'Pass --project <workerProjectId> or --report <workerReportId> (or run in a TTY with share.json entries).';
    if (ctx.run.json) {
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('share-view', {
            kind: 'share-view',
            shareKind: 'project',
            workerId: '',
            links: {},
          }, {
            ok: false,
            issues: [{ severity: 'error', code: ISSUE_SHARE_REMOTE_ERROR, message }],
            cwd: ctx.adapters.system.cwd(),
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

  const workerHooks = createShareWorkerHooks(target.workerBaseUrl);
  const res = await runShareView({
    ctx: coreCtx,
    kind: target.kind,
    workerBaseUrl: target.workerBaseUrl,
    workerId: target.workerId,
    hooks: workerHooks,
  });

  const issues = [...listed.issues, ...res.issues];
  const ok = !issues.some((i) => i.severity === 'error');
  const payload: ShareViewJsonPayload = {
    kind: 'share-view',
    shareKind: res.kind,
    workerId: res.workerId,
    remote: res.remote,
    local: res.local,
    links: res.links,
  };

  if (ctx.run.json) {
    console.log(
      stringifyEnvelope(
        buildCliJsonEnvelope('share-view', payload, {
          ok,
          issues,
          cwd: ctx.adapters.system.cwd(),
        }),
      ),
    );
    applyCliCiExitGate(ok);
    return;
  }

  for (const issue of issues) {
    if (issue.severity === 'warning') logger.warn(issue.message, ctx.run);
    else if (issue.severity === 'error') logger.err(issue.message);
  }
  emitShareViewHumanMessages(
    { emit: createCliRunEmitter(ctx.run), runId: randomUUID() },
    res,
  );
  printCommandSummary(
    {
      command: 'share view',
      ok,
      durationMs: wall.elapsedMs(),
      counts: {},
      issues,
    },
    ctx,
  );
  applyCliCiExitGate(ok);
}
