import {
  buildCliJsonEnvelope,
  runShareList,
  runShareView,
  stringifyEnvelope,
} from '@i18nprune/core';
import { resolveContext } from '@/shared/context/index.js';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { printCommandSummary } from '@/output/index.js';
import { logger } from '@/utils/logger/index.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import {
  buildShareViewVerboseDetail,
  emitShareViewHumanMessages,
  ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND,
  ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND,
  ISSUE_SHARE_STALE_CACHE_ROW_REMOVED,
  type ShareViewJsonPayload,
  type ShareViewOptions,
} from '@i18nprune/core';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import { randomUUID } from 'node:crypto';
import { emitShareListCacheDebug } from './cacheDebug.js';
import {
  emitShareCacheEmptyHints,
  resolveShareCommandTarget,
  shareBothKindsIssue,
  shareCacheEmptyIssue,
  shareNeedIdIssue,
} from './resolveTarget.js';
import { createShareWorkerHooks } from './worker/http.js';

export async function shareView(opts: ShareViewOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const coreCtx = createCliCoreContext(ctx);
    const listed = runShareList({ ctx: coreCtx });
    const resolved = await resolveShareCommandTarget(
      opts,
      listed.entries,
      'Select a cached share entry',
      ctx.run,
    );

    if (resolved.status !== 'ok') {
      const issues =
        resolved.status === 'empty_cache'
          ? [shareCacheEmptyIssue()]
          : resolved.status === 'both_kinds'
            ? [shareBothKindsIssue()]
            : [shareNeedIdIssue('view', listed.entries.length > 0, ctx.run)];
      const ok = resolved.status === 'empty_cache';

      if (ctx.run.json) {
        console.log(
          stringifyEnvelope(
            buildCliJsonEnvelope(
              'share-view',
              {
                kind: 'share-view',
                shareKind: 'project',
                workerId: '',
                links: {},
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
        emitShareCacheEmptyHints(ctx, 'view');
      } else if (resolved.status === 'need_id') {
        logger.err(issues[0]!.message);
      } else {
        logger.err(issues[0]!.message);
      }
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
      return;
    }

    const target = resolved.target;
    const workerHooks = createShareWorkerHooks(target.workerBaseUrl, ctx.run);
    const res = await runShareView({
      ctx: coreCtx,
      kind: target.kind,
      workerBaseUrl: target.workerBaseUrl,
      workerId: target.workerId,
      hooks: workerHooks,
    });

    let issues = [...listed.issues, ...res.issues];
    const ok = !issues.some((i) => i.severity === 'error');
    const verboseDetail = opts.verbose ? buildShareViewVerboseDetail(res) : undefined;
    const payload: ShareViewJsonPayload = {
      kind: 'share-view',
      shareKind: res.kind,
      workerId: res.workerId,
      remote: res.remoteMetadata ?? res.remote,
      local: res.local,
      links: res.links,
      ...(verboseDetail !== undefined ? { verbose: verboseDetail } : {}),
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

    const runHost = { emit: createCliRunEmitter(ctx.run), runId: randomUUID() };
    emitShareListCacheDebug(ctx, coreCtx, listed, listed.entries.length, runHost);
    for (const issue of issues) {
      if (
        issue.code === ISSUE_SHARE_STALE_CACHE_ROW_REMOVED ||
        issue.code === ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND ||
        issue.code === ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND
      ) {
        continue;
      }
      if (issue.severity === 'warning') logger.warn(issue.message, ctx.run);
      else if (issue.severity === 'error') logger.err(issue.message);
    }
    emitShareViewHumanMessages(runHost, res, opts.verbose ? { verbose: true } : undefined);
    const summaryIssues = issues.filter(
      (i) =>
        i.code !== ISSUE_SHARE_STALE_CACHE_ROW_REMOVED &&
        i.code !== ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND &&
        i.code !== ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND,
    );
    printCommandSummary(
      {
        command: 'share view',
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
