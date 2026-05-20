import { emitRunMessage } from '../shared/run/index.js';
import type { RunEmitter, RunMessageLevel } from '../types/shared/run/index.js';
import type { ShareCacheEntry } from '../types/share/entry.js';
import type { ShareRunResult, ShareViewResult } from '../types/share/shareRun.js';

const SHARE_TTL_HINT = 'Hosted rows expire after ~7 days without reads.';

export type ShareHumanMessageHost = {
  emit?: RunEmitter;
  runId?: string;
};

function shareMessage(host: ShareHumanMessageHost, level: RunMessageLevel, message: string): void {
  emitRunMessage(host.emit, { op: 'share', runId: host.runId, level, message });
}

/** Emits human-oriented lines for a {@link runShare} result (hosts render `run.message` events). */
export function emitShareUploadHumanMessages(host: ShareHumanMessageHost, res: ShareRunResult): void {
  if (res.manifest) {
    const m = res.manifest;
    if (m.kind === 'project') {
      shareMessage(
        host,
        'info',
        `Prepared project snapshot: ${String(m.fileCount)} files, ${String(m.byteSize)} bytes, config hash ${m.configHash.slice(0, 12)}…`,
      );
    } else {
      shareMessage(
        host,
        'info',
        `Prepared report: ${String(m.byteSize)} bytes, schema v${String(m.schemaVersion)}, tool ${m.toolVersion}`,
      );
    }
  }
  if (res.action === 'skipped' && res.skippedReason) {
    shareMessage(host, 'notice', `Share skipped (${res.skippedReason}).`);
  } else if (res.action === 'uploaded') {
    shareMessage(host, 'info', 'Uploaded to worker.');
  } else if (res.action === 'link-only') {
    shareMessage(host, 'info', 'Link-only (existing worker row).');
  }
  if (res.links.web) shareMessage(host, 'info', `Web: ${res.links.web}`);
  if (res.links.report) shareMessage(host, 'info', `Report: ${res.links.report}`);
  if (res.links.worker) shareMessage(host, 'info', `Worker metadata: ${res.links.worker}`);
  shareMessage(host, 'detail', SHARE_TTL_HINT);
}

/** Emits human-oriented lines for {@link runShareList} output. */
export function emitShareListHumanMessages(host: ShareHumanMessageHost, entries: readonly ShareCacheEntry[]): void {
  if (entries.length === 0) {
    shareMessage(host, 'info', 'No share.json entries for this project (cache disabled or never shared).');
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
  shareMessage(host, 'info', `[${res.kind}] worker id ${res.workerId}`);
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
        `Remote: ${String(r.fileCount ?? '?')} files, ${String(r.zipBytes ?? r.byteSize ?? '?')} bytes, last accessed ${String(r.lastAccessedAt ?? '-')}`,
      );
    } else {
      shareMessage(
        host,
        'info',
        `Remote: schema v${String(r.schemaVersion ?? '?')}, ${String(r.byteSize ?? '?')} bytes, ok=${String((r.summary as Record<string, unknown> | undefined)?.ok ?? '?')}`,
      );
    }
  }
  if (res.links.web) shareMessage(host, 'info', `Web: ${res.links.web}`);
  if (res.links.report) shareMessage(host, 'info', `Report: ${res.links.report}`);
  if (res.links.worker) shareMessage(host, 'info', `Worker: ${res.links.worker}`);
  shareMessage(host, 'detail', SHARE_TTL_HINT);
}

/** Emits human-oriented lines for {@link runShareDelete} output. */
export function emitShareDeleteHumanMessages(
  host: ShareHumanMessageHost,
  input: { deletedLocal: boolean; deletedRemote: boolean },
): void {
  if (input.deletedLocal) shareMessage(host, 'info', 'Removed matching share.json entry.');
  if (input.deletedRemote) shareMessage(host, 'info', 'Deleted remote worker row.');
  if (!input.deletedLocal && !input.deletedRemote) {
    shareMessage(host, 'warn', 'Nothing deleted (no matching share.json entry and worker row was not removed).');
  }
}
