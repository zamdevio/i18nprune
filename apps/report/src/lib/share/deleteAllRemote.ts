import { deleteWorkerReport } from '../../worker/index.js';
import { removeShareHistoryEntry } from '../../storage/shareHistory.js';
import {
  clearRemoteDeleteQueue,
  readRemoteDeleteQueue,
  writeRemoteDeleteQueue,
} from '../../storage/remoteDeleteQueue.js';
import { readWorkerUrl } from '../../storage/workerUrl.js';

export type RemoteDeleteProgress = {
  done: number;
  total: number;
  reportId: string;
  stopped: boolean;
  lastError: string | null;
};

export function pendingRemoteDeleteCount(): number {
  return readRemoteDeleteQueue()?.reportIds.length ?? 0;
}

export function startRemoteDeleteQueue(reportIds: string[]): void {
  const unique = [...new Set(reportIds.map((id) => id.trim()).filter(Boolean))];
  writeRemoteDeleteQueue({ reportIds: unique, updatedAt: new Date().toISOString() });
}

/**
 * Deletes worker reports one at a time. Persists the queue after each success so a reload can resume.
 */
export async function runRemoteDeleteQueue(
  onProgress?: (progress: RemoteDeleteProgress) => void,
): Promise<RemoteDeleteProgress> {
  const initial = readRemoteDeleteQueue();
  const total = initial?.reportIds.length ?? 0;
  const workerBaseUrl = readWorkerUrl();
  let done = 0;
  let lastError: string | null = null;

  while (true) {
    const queue = readRemoteDeleteQueue();
    const reportId = queue?.reportIds[0];
    if (!reportId) break;

    const result = await deleteWorkerReport(workerBaseUrl, reportId);
    if (!result.ok) {
      lastError = result.issue.message;
      onProgress?.({ done, total, reportId, stopped: true, lastError });
      return { done, total, reportId, stopped: true, lastError };
    }

    removeShareHistoryEntry(reportId);
    done += 1;
    const rest = queue.reportIds.slice(1);
    if (rest.length === 0) clearRemoteDeleteQueue();
    else writeRemoteDeleteQueue({ reportIds: rest, updatedAt: new Date().toISOString() });

    onProgress?.({ done, total, reportId, stopped: false, lastError: null });
  }

  return { done, total, reportId: '', stopped: false, lastError: null };
}
