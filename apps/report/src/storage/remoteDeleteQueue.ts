import { REMOTE_DELETE_QUEUE_STORAGE_KEY } from '../constants/storageKeys.js';

export type RemoteDeleteQueue = {
  reportIds: string[];
  updatedAt: string;
};

export function readRemoteDeleteQueue(): RemoteDeleteQueue | null {
  try {
    const raw = localStorage.getItem(REMOTE_DELETE_QUEUE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RemoteDeleteQueue;
    if (!parsed || !Array.isArray(parsed.reportIds)) return null;
    return {
      reportIds: parsed.reportIds.filter((id) => typeof id === 'string' && id.length > 0),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeRemoteDeleteQueue(queue: RemoteDeleteQueue): void {
  try {
    localStorage.setItem(REMOTE_DELETE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    /* ignore */
  }
}

export function clearRemoteDeleteQueue(): void {
  try {
    localStorage.removeItem(REMOTE_DELETE_QUEUE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
