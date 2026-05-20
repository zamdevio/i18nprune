import type { WorkspaceSession } from '@i18nprune/core';

type MemoEntry = { payload: unknown; title: string; curl: string };

const memo = new Map<string, MemoEntry>();

/** Tab-only memo of successful workspace op JSON (not the project snapshot). */
export function clearOpMemo(): void {
  memo.clear();
}

function memoPayloadOk(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const o = payload as Record<string, unknown>;
  if (!('success' in o) || typeof o.success !== 'boolean') return false;
  return o.success === true;
}

export function opMemoKey(session: WorkspaceSession, opTitle: string): string {
  const id = session.mode === 'remote' ? session.projectId : session.local.snapshot.projectId;
  return `${session.mode}:${id}:${opTitle}`;
}

export function readOpMemo(key: string): MemoEntry | undefined {
  return memo.get(key);
}

export function writeOpMemo(key: string, entry: MemoEntry): void {
  if (!memoPayloadOk(entry.payload)) return;
  memo.set(key, entry);
}
