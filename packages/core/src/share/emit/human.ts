import { emitRunMessage } from '../../shared/run/index.js';
import {
  ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND,
  ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND,
  ISSUE_SHARE_STALE_CACHE_ROW_REMOVED,
} from '../../shared/constants/issueCodes.js';
import type { RunEmitter, RunMessageLevel } from '../../types/shared/run/index.js';
import type { ShareCacheEntry, ShareJsonHealReport } from '../../types/share/entry.js';
import type { ShareRunResult, ShareViewResult } from '../../types/share/shareRun.js';
import {
  SHARE_JSON_HEAL_BACKUP_LABEL,
  SHARE_JSON_HEAL_CANONICAL_SAVED,
} from '../cache/shareJsonBackup.js';

function shareTtlHint(kind: 'project' | 'report'): string {
  if (kind === 'project') {
    return 'Hosted project snapshots expire after ~7 days without reads on the worker.';
  }
  return 'Hosted report links expire after ~7 days without reads on the worker.';
}

export type ShareHumanMessageHost = {
  emit?: RunEmitter;
  runId?: string;
};

function shareMessage(host: ShareHumanMessageHost, level: RunMessageLevel, message: string): void {
  emitRunMessage(host.emit, { op: 'share', runId: host.runId, level, message });
}

/** Emits human-oriented lines for a {@link runShare} result (hosts render `run.message` events). */
export function emitShareUploadHumanMessages(host: ShareHumanMessageHost, res: ShareRunResult): void {
  const staleRemoved = res.issues.find((i) => i.code === ISSUE_SHARE_STALE_CACHE_ROW_REMOVED);
  if (staleRemoved) {
    shareMessage(host, 'warn', staleRemoved.message);
    for (const row of res.purgedStaleCacheRows ?? []) {
      shareMessage(host, 'detail', `  removed ${row.kind} ${row.workerId}`);
    }
  }
  if (res.manifest) {
    const m = res.manifest;
    if (m.kind === 'project') {
      if (res.skippedReason === 'cache_epoch_unchanged') {
        shareMessage(
          host,
          'info',
          `Tracked project files unchanged (cache epoch) — skipped prepare; reusing worker project ${res.workerIds.projectId ?? '?'}.`,
        );
      } else if (m.fileCount > 0) {
        shareMessage(
          host,
          'info',
          `Prepared project snapshot: ${String(m.fileCount)} files, ${String(m.byteSize)} bytes, config hash ${m.configHash.slice(0, 12)}…`,
        );
      }
    } else {
      shareMessage(
        host,
        'info',
        `Prepared report: ${String(m.byteSize)} bytes, schema v${String(m.schemaVersion)}, tool ${m.toolVersion}`,
      );
    }
  }
  if (res.action === 'skipped' && res.skippedReason) {
    const skipLabel =
      res.skippedReason === 'cache_epoch_unchanged'
        ? 'unchanged tracked files (cache epoch)'
        : res.skippedReason === 'hash_unchanged'
          ? 'unchanged share payload hash'
          : res.skippedReason;
    shareMessage(host, 'notice', `Share skipped (${skipLabel}).`);
  } else if (res.action === 'uploaded') {
    shareMessage(host, 'info', 'Uploaded to worker.');
  } else if (res.action === 'link-only') {
    shareMessage(host, 'info', 'Link-only (existing worker row).');
  }
  if (res.links.web) shareMessage(host, 'info', `Web: ${res.links.web}`);
  if (res.links.report) shareMessage(host, 'info', `Report: ${res.links.report}`);
  if (res.links.worker) shareMessage(host, 'info', `Worker metadata: ${res.links.worker}`);
  const showTtl =
    res.action === 'uploaded' ||
    (res.action === 'skipped' &&
      (res.skippedReason === 'hash_unchanged' || res.skippedReason === 'cache_epoch_unchanged'));
  if (showTtl) {
    shareMessage(host, 'info', shareTtlHint(res.kind));
  }
}

/** Emits human-oriented lines when {@link loadShareJsonFile} repaired `share.json`. */
export function emitShareJsonHealHumanMessages(host: ShareHumanMessageHost, heal: ShareJsonHealReport): void {
  if (!heal.repaired) return;
  shareMessage(
    host,
    'warn',
    'share.json was auto-repaired (manual edits or legacy format). Do not edit it by hand — use share list / share delete.',
  );
  for (const line of heal.details) {
    if (line === heal.backupBakPath || line === SHARE_JSON_HEAL_BACKUP_LABEL) continue;
    shareMessage(host, 'detail', `  • ${line}`);
  }
  if (heal.backupBakPath) {
    shareMessage(host, 'detail', `  • ${SHARE_JSON_HEAL_BACKUP_LABEL}`);
    shareMessage(host, 'detail', `    ${heal.backupBakPath}`);
  }
  shareMessage(host, 'detail', `  • ${SHARE_JSON_HEAL_CANONICAL_SAVED}`);
}

/** Emits human-oriented lines for {@link runShareList} output. */
export function emitShareListHumanMessages(host: ShareHumanMessageHost, entries: readonly ShareCacheEntry[]): void {
  if (entries.length === 0) {
    shareMessage(
      host,
      'info',
      'No share.json entries for this project (cache disabled or never shared). Run share upload --project or --report first.',
    );
    return;
  }
  for (const e of entries) {
    const id = e.kind === 'project' ? e.workerProjectId : e.workerReportId;
    const link = e.links.web ?? e.links.report ?? e.links.worker ?? '-';
    shareMessage(
      host,
      'info',
      `[${e.kind}] ${id ?? '-'} @ ${e.workerBaseUrl} — ${String(e.byteSize)} B, uploaded ${e.uploadedAt}, last used ${e.lastUsedAt}`,
    );
    shareMessage(host, 'detail', `  ${link}`);
  }
}

/** Emits human-oriented lines for {@link runShareView} output. */
export function emitShareViewHumanMessages(host: ShareHumanMessageHost, res: ShareViewResult): void {
  const remoteGone = res.issues.some(
    (i) => i.code === ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND || i.code === ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND,
  );
  const staleRemoved = res.issues.find((i) => i.code === ISSUE_SHARE_STALE_CACHE_ROW_REMOVED);
  const notFound = res.issues.find(
    (i) => i.code === ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND || i.code === ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND,
  );

  shareMessage(host, 'info', `[${res.kind}] worker id ${res.workerId}`);
  if (notFound) {
    shareMessage(host, 'warn', notFound.message);
  }
  if (staleRemoved) {
    shareMessage(host, 'warn', staleRemoved.message);
    shareMessage(host, 'detail', `  removed ${res.kind} ${res.workerId}`);
  }
  if (res.local) {
    shareMessage(
      host,
      'info',
      `Local cache: uploaded ${res.local.uploadedAt}, payload hash ${res.local.payloadContentHash.slice(0, 12)}…`,
    );
  }
  if (res.remote && typeof res.remote === 'object' && res.remote !== null) {
    const r = res.remote as Record<string, unknown>;
    if (res.kind === 'project') {
      shareMessage(
        host,
        'info',
        `Remote: ${String(r.fileCount ?? '?')} files, ${String(r.zipBytes ?? r.byteSize ?? '?')} bytes`,
      );
    } else {
      shareMessage(
        host,
        'info',
        `Remote: schema v${String(r.schemaVersion ?? '?')}, ${String(r.byteSize ?? '?')} bytes, ok=${String((r.summary as Record<string, unknown> | undefined)?.ok ?? '?')}`,
      );
    }
  }
  if (!remoteGone) {
    if (res.links.web) shareMessage(host, 'info', `Web: ${res.links.web}`);
    if (res.links.report) shareMessage(host, 'info', `Report: ${res.links.report}`);
    if (res.links.worker) shareMessage(host, 'info', `Worker: ${res.links.worker}`);
    if (res.remote) shareMessage(host, 'info', shareTtlHint(res.kind));
  }
}

/** Emits human-oriented lines for {@link runShareDelete} output. */
export function emitShareDeleteHumanMessages(
  host: ShareHumanMessageHost,
  input: {
    shareKind: 'project' | 'report';
    workerId: string;
    deletedLocal: boolean;
    deletedRemote: boolean;
    remoteAlreadyAbsent?: boolean;
  },
): void {
  if (input.deletedLocal) {
    shareMessage(host, 'info', 'Removed matching share.json entry.');
  }
  if (input.deletedRemote) {
    if (input.remoteAlreadyAbsent) {
      shareMessage(host, 'notice', 'Remote worker row was already gone (treated as deleted).');
    } else {
      shareMessage(host, 'info', 'Deleted remote worker row.');
    }
  }
  if (!input.deletedLocal && !input.deletedRemote) {
    shareMessage(host, 'warn', 'Nothing deleted (no share.json row and worker DELETE did not succeed).');
  } else if (!input.deletedRemote && !input.remoteAlreadyAbsent) {
    shareMessage(host, 'warn', 'Worker row was not removed (see errors above).');
  }
}
