import {
  buildCliJsonEnvelope,
  ISSUE_SHARE_REMOTE_ERROR,
  runShareList,
  stringifyEnvelope,
} from '@i18nprune/core';
import { resolveContext } from '@/shared/context/index.js';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { printCommandSummary } from '@/output/index.js';
import { logger } from '@/utils/logger/index.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import {
  emitShareListHumanMessages,
  ISSUE_SHARE_JSON_REPAIRED,
  type ShareCacheEntry,
  type ShareListJsonPayload,
  type ShareListOptions,
} from '@i18nprune/core';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import { randomUUID } from 'node:crypto';
import { emitShareListCacheDebug } from './cacheDebug.js';

function filterEntries(entries: ShareCacheEntry[], opts: ShareListOptions): ShareCacheEntry[] {
  if (opts.project) {
    return entries.filter((e) => e.kind === 'project' && e.workerProjectId === opts.project);
  }
  if (opts.report) {
    return entries.filter((e) => e.kind === 'report' && e.workerReportId === opts.report);
  }
  return entries;
}

export async function shareList(opts: ShareListOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
  if (opts.project && opts.report) {
    const message = 'Pass only one of --project or --report to filter.';
    const ctx = await resolveContext();
    if (ctx.run.json) {
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('share-list', { kind: 'share-list', entries: [] }, {
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

  const ctx = await resolveContext();
  const coreCtx = createCliCoreContext(ctx);
  const listed = runShareList({ ctx: coreCtx });
  const entries = filterEntries(listed.entries, opts);
  const ok = !listed.issues.some((i) => i.severity === 'error');
  const payload: ShareListJsonPayload = { kind: 'share-list', entries };

  if (ctx.run.json) {
    console.log(
      stringifyEnvelope(
        buildCliJsonEnvelope('share-list', payload, {
          ok,
          issues: listed.issues,
          cwd: ctx.adapters.system.cwd(),
        }),
      ),
    );
    applyCliCiExitGate(ok);
    return;
  }

  const runHost = { emit: createCliRunEmitter(ctx.run), runId: randomUUID() };
  emitShareListCacheDebug(ctx, coreCtx, listed, entries.length, runHost);
  for (const issue of listed.issues) {
    if (issue.severity === 'warning' && issue.code !== ISSUE_SHARE_JSON_REPAIRED) {
      logger.warn(issue.message, ctx.run);
    }
  }
  emitShareListHumanMessages(runHost, entries);
  printCommandSummary(
    {
      command: 'share list',
      ok,
      durationMs: wall.elapsedMs(),
      counts: { entries: entries.length },
      issues: listed.issues,
    },
    ctx,
  );
  applyCliCiExitGate(ok);
  } finally {
    wall.dispose();
  }
}
