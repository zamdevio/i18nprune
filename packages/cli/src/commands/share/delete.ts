import {
  buildCliJsonEnvelope,
  ISSUE_SHARE_REMOTE_ERROR,
  runShareDelete,
  runShareList,
  stringifyEnvelope,
} from '@i18nprune/core';
import { resolveContext } from '@/shared/context/index.js';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { printCommandSummary } from '@/output/index.js';
import { logger } from '@/utils/logger/index.js';
import { canAsk } from '@/shared/ask/gate.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import {
  emitShareDeleteHumanMessages,
  ISSUE_SHARE_JSON_REPAIRED,
  type ShareCacheEntry,
  type ShareDeleteAllJsonPayload,
  type ShareDeleteJsonPayload,
  type ShareDeleteOptions,
  type ShareDeleteRowResult,
  type ShareKind,
} from '@i18nprune/core';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import { emitShareListCacheDebug } from './cacheDebug.js';
import { confirmShareDeleteAll } from './prompts.js';
import {
  emitShareCacheEmptyHints,
  resolveShareCommandTarget,
  shareBothKindsIssue,
  shareCacheEmptyIssue,
  shareNeedIdIssue,
} from './resolveTarget.js';
import { createShareWorkerHooks } from './worker/http.js';
import { randomUUID } from 'node:crypto';

function entryWorkerId(entry: ShareCacheEntry): string | undefined {
  return entry.kind === 'project' ? entry.workerProjectId : entry.workerReportId;
}

function targetsForDeleteAll(entries: readonly ShareCacheEntry[]): Array<{
  kind: ShareKind;
  workerId: string;
  workerBaseUrl: string;
}> {
  const out: Array<{ kind: ShareKind; workerId: string; workerBaseUrl: string }> = [];
  for (const e of entries) {
    const workerId = entryWorkerId(e);
    if (!workerId) continue;
    out.push({ kind: e.kind, workerId, workerBaseUrl: e.workerBaseUrl });
  }
  return out;
}

async function shareDeleteAll(opts: ShareDeleteOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const coreCtx = createCliCoreContext(ctx);
    const listed = runShareList({ ctx: coreCtx });
    const targets = targetsForDeleteAll(listed.entries);

    if (targets.length === 0) {
      const issues = [...listed.issues, shareCacheEmptyIssue()];
      if (ctx.run.json) {
        const payload: ShareDeleteAllJsonPayload = { kind: 'share-delete-all', deletions: [] };
        console.log(
          stringifyEnvelope(
            buildCliJsonEnvelope('share-delete-all', payload, {
              ok: true,
              issues,
              cwd: ctx.adapters.system.cwd(),
            }),
          ),
        );
        applyCliCiExitGate(true);
        return;
      }
      emitShareCacheEmptyHints(ctx, 'delete');
      printCommandSummary(
        { command: 'share delete --all', ok: true, durationMs: wall.elapsedMs(), counts: {}, issues },
        ctx,
      );
      applyCliCiExitGate(true);
      return;
    }

    if (canAsk(ctx.run) && !getCliYesFlag() && !ctx.run.json) {
      const ok = await confirmShareDeleteAll(targets.length);
      if (!ok) {
        logger.info('Bulk delete cancelled.', ctx.run);
        printCommandSummary(
          { command: 'share delete --all', ok: true, durationMs: wall.elapsedMs(), counts: {}, issues: listed.issues },
          ctx,
        );
        return;
      }
    }

    const deletions: ShareDeleteRowResult[] = [];
    const allIssues = [...listed.issues];

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i]!;
      const workerHooks = createShareWorkerHooks(target.workerBaseUrl, ctx.run);
      const res = await runShareDelete({
        ctx: coreCtx,
        kind: target.kind,
        workerBaseUrl: target.workerBaseUrl,
        workerId: target.workerId,
        remote: !opts.localOnly,
        hooks: workerHooks,
      });
      allIssues.push(...res.issues);
      deletions.push({
        shareKind: target.kind,
        workerId: target.workerId,
        deletedLocal: res.deletedLocal,
        deletedRemote: res.deletedRemote,
        ...(res.remoteAlreadyAbsent ? { remoteAlreadyAbsent: true } : {}),
      });

      if (!ctx.run.json) {
        logger.info(
          `[${String(i + 1)}/${String(targets.length)}] ${target.kind} ${target.workerId}`,
          ctx.run,
        );
        emitShareDeleteHumanMessages(
          { emit: createCliRunEmitter(ctx.run), runId: randomUUID() },
          {
            shareKind: target.kind,
            workerId: target.workerId,
            deletedLocal: res.deletedLocal,
            deletedRemote: res.deletedRemote,
            remoteAlreadyAbsent: res.remoteAlreadyAbsent,
          },
        );
      }
    }

    const ok = !allIssues.some((i) => i.severity === 'error');
    if (ctx.run.json) {
      const payload: ShareDeleteAllJsonPayload = { kind: 'share-delete-all', deletions };
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('share-delete-all', payload, {
            ok,
            issues: allIssues,
            cwd: ctx.adapters.system.cwd(),
          }),
        ),
      );
      applyCliCiExitGate(ok);
      return;
    }

    const runHost = { emit: createCliRunEmitter(ctx.run), runId: randomUUID() };
    emitShareListCacheDebug(ctx, coreCtx, listed, listed.entries.length, runHost);
    for (const issue of allIssues) {
      if (issue.severity === 'warning' && issue.code !== ISSUE_SHARE_JSON_REPAIRED) {
        logger.warn(issue.message, ctx.run);
      } else if (issue.severity === 'error') {
        logger.err(issue.message);
      }
    }
    logger.info(
      `Bulk delete finished: ${String(deletions.length)} row(s), ${String(deletions.filter((d) => d.deletedRemote).length)} remote DELETE(s).`,
      ctx.run,
    );
    printCommandSummary(
      {
        command: 'share delete --all',
        ok,
        durationMs: wall.elapsedMs(),
        counts: { deleted: deletions.length },
        issues: allIssues,
      },
      ctx,
    );
    applyCliCiExitGate(ok);
  } finally {
    wall.dispose();
  }
}

export async function shareDelete(opts: ShareDeleteOptions): Promise<void> {
  if (opts.all) {
    if (opts.project || opts.report) {
      const ctx = await resolveContext();
      const message = 'Pass only --all, or one of --project / --report (not both).';
      if (ctx.run.json) {
        console.log(
          stringifyEnvelope(
            buildCliJsonEnvelope('share-delete-all', { kind: 'share-delete-all', deletions: [], aborted: true }, {
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
    await shareDeleteAll(opts);
    return;
  }

  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const coreCtx = createCliCoreContext(ctx);
    const listed = runShareList({ ctx: coreCtx });
    const resolved = await resolveShareCommandTarget(
      opts,
      listed.entries,
      'Delete which cached upload?',
      ctx.run,
    );

    if (resolved.status !== 'ok') {
      const issues =
        resolved.status === 'empty_cache'
          ? [...listed.issues, shareCacheEmptyIssue()]
          : resolved.status === 'both_kinds'
            ? [...listed.issues, shareBothKindsIssue()]
            : [...listed.issues, shareNeedIdIssue('delete', listed.entries.length > 0, ctx.run)];
      const ok = resolved.status === 'empty_cache';

      if (ctx.run.json) {
        console.log(
          stringifyEnvelope(
            buildCliJsonEnvelope(
              'share-delete',
              {
                kind: 'share-delete',
                shareKind: 'project',
                workerId: '',
                deletedLocal: false,
                deletedRemote: false,
              },
              {
                ok,
                issues,
                cwd: ctx.adapters.system.cwd(),
              },
            ),
          ),
        );
        applyCliCiExitGate(ok);
        return;
      }

      if (resolved.status === 'empty_cache') {
        emitShareCacheEmptyHints(ctx, 'delete');
      } else if (resolved.status === 'need_id') {
        logger.err(issues.find((i) => i.severity === 'error')?.message ?? issues[0]!.message);
      } else {
        logger.err(issues[0]!.message);
      }
      printCommandSummary(
        { command: 'share delete', ok, durationMs: wall.elapsedMs(), counts: {}, issues },
        ctx,
      );
      applyCliCiExitGate(ok);
      return;
    }

    const target = resolved.target;
    const workerHooks = createShareWorkerHooks(target.workerBaseUrl, ctx.run);
    const res = await runShareDelete({
      ctx: coreCtx,
      kind: target.kind,
      workerBaseUrl: target.workerBaseUrl,
      workerId: target.workerId,
      remote: !opts.localOnly,
      hooks: workerHooks,
    });

    const issues = [...listed.issues, ...res.issues];
    const ok = !issues.some((i) => i.severity === 'error');
    const payload: ShareDeleteJsonPayload = {
      kind: 'share-delete',
      shareKind: target.kind,
      workerId: target.workerId,
      deletedLocal: res.deletedLocal,
      deletedRemote: res.deletedRemote,
      ...(res.remoteAlreadyAbsent ? { remoteAlreadyAbsent: true } : {}),
    };

    if (ctx.run.json) {
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('share-delete', payload, {
            ok,
            issues,
            cwd: ctx.adapters.system.cwd(),
          }),
        ),
      );
      applyCliCiExitGate(ok);
      return;
    }

    const runHost = { emit: createCliRunEmitter(ctx.run), runId: randomUUID() };
    emitShareListCacheDebug(ctx, coreCtx, listed, listed.entries.length, runHost);
    for (const issue of issues) {
      if (issue.severity === 'warning' && issue.code !== ISSUE_SHARE_JSON_REPAIRED) {
        logger.warn(issue.message, ctx.run);
      } else if (issue.severity === 'error') {
        logger.err(issue.message);
      }
    }
    emitShareDeleteHumanMessages(runHost, {
      shareKind: target.kind,
      workerId: target.workerId,
      deletedLocal: res.deletedLocal,
      deletedRemote: res.deletedRemote,
      remoteAlreadyAbsent: res.remoteAlreadyAbsent,
    });
    printCommandSummary(
      {
        command: 'share delete',
        ok,
        durationMs: wall.elapsedMs(),
        counts: {},
        issues,
      },
      ctx,
    );
    applyCliCiExitGate(ok);
  } finally {
    wall.dispose();
  }
}
