import {
  ISSUE_SHARE_CACHE_EMPTY,
  ISSUE_SHARE_REMOTE_ERROR,
  type Issue,
  type RunOptions,
  type ShareCacheEntry,
  type ShareKind,
} from '@i18nprune/core';
import { canAsk } from '@/shared/ask/gate.js';
import { logger } from '@/utils/logger/index.js';
import type { Context } from '@/types/core/context/index.js';
import { promptSharePickEntry } from './prompts.js';
import { resolveCliShareWorkerBaseUrl } from './worker/url.js';

export type ShareResolvedTarget = {
  kind: ShareKind;
  workerId: string;
  workerBaseUrl: string;
};

export type ShareTargetResolution =
  | { status: 'ok'; target: ShareResolvedTarget }
  | { status: 'empty_cache' }
  | { status: 'both_kinds' }
  | { status: 'need_id' };

export type ShareIdOptions = {
  project?: string;
  report?: string;
  workerUrl?: string;
};

function entryWorkerId(entry: ShareCacheEntry): string | undefined {
  return entry.kind === 'project' ? entry.workerProjectId : entry.workerReportId;
}

export function shareCacheEmptyIssue(): Issue {
  return {
    severity: 'warning',
    code: ISSUE_SHARE_CACHE_EMPTY,
    message: 'No uploads recorded in share.json for this project.',
  };
}

/** Info + dim detail lines when share.json has no rows and no worker id flags were passed. */
export function emitShareCacheEmptyHints(ctx: Context, command: 'view' | 'delete'): void {
  logger.info('No uploads recorded in share.json for this project.', ctx.run);
  logger.detail('  Upload first: i18nprune share upload --project', ctx.run);
  logger.detail('  Or report:     i18nprune share upload --report --from <file>', ctx.run);
  if (command === 'delete') {
    logger.detail('  Bulk cleanup:  i18nprune share delete --all', ctx.run);
    logger.detail('  Or one id:     i18nprune share delete --project <id>  |  --report <id>', ctx.run);
  } else {
    logger.detail('  Or one id:     i18nprune share view --project <id>  |  --report <id>', ctx.run);
  }
  logger.detail('  List cache:    i18nprune share list', ctx.run);
}

export function shareBothKindsIssue(): Issue {
  return {
    severity: 'error',
    code: ISSUE_SHARE_REMOTE_ERROR,
    message: 'Pass only one of --project or --report.',
  };
}

export function shareNeedIdIssue(command: 'view' | 'delete', hasCacheEntries: boolean, run?: RunOptions): Issue {
  if (!hasCacheEntries) return shareCacheEmptyIssue();
  const flags =
    command === 'delete'
      ? '--project <id>, --report <id>, or --all'
      : '--project <id> or --report <id>';
  const message =
    run?.json || !canAsk(run)
      ? `Pass ${flags} when using --json or in non-interactive mode (interactive select is not available).`
      : `Pass ${flags}, or run in a TTY to pick from share.json.`;
  return {
    severity: 'error',
    code: ISSUE_SHARE_REMOTE_ERROR,
    message,
  };
}

/**
 * Resolves view/delete target from flags, or interactive pick when share.json has rows.
 */
export async function resolveShareCommandTarget(
  opts: ShareIdOptions,
  entries: readonly ShareCacheEntry[],
  pickMessage: string,
  run?: RunOptions,
): Promise<ShareTargetResolution> {
  if (opts.project && opts.report) return { status: 'both_kinds' };
  if (typeof opts.project === 'string' && opts.project.length > 0) {
    return {
      status: 'ok',
      target: {
        kind: 'project',
        workerId: opts.project,
        workerBaseUrl: resolveCliShareWorkerBaseUrl(opts.workerUrl),
      },
    };
  }
  if (typeof opts.report === 'string' && opts.report.length > 0) {
    return {
      status: 'ok',
      target: {
        kind: 'report',
        workerId: opts.report,
        workerBaseUrl: resolveCliShareWorkerBaseUrl(opts.workerUrl),
      },
    };
  }
  if (entries.length === 0) return { status: 'empty_cache' };
  if (!canAsk(run)) return { status: 'need_id' };
  const picked = await promptSharePickEntry(entries, pickMessage);
  const workerId = entryWorkerId(picked);
  if (!workerId) return { status: 'need_id' };
  return {
    status: 'ok',
    target: { kind: picked.kind, workerId, workerBaseUrl: picked.workerBaseUrl },
  };
}
