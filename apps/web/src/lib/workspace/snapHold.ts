/**
 * Remote tab hold: mirrors worker DO — one GET /snapshot payload, then slice like getProjectById routes.
 * No zip rescan; validate/review/report read snapshot.extraction + locale JSON only (same as `apps/workers/i18nprune` routes).
 */
import type { ParsedProjectUpload, ProjectSnapshot, WorkerApiEnvelope, WorkspaceSession } from '@i18nprune/core';
import { getProjectSnapshot } from '../services/api/client';
import { seedOpMemoFromSnap, type SnapCurls } from './snapSeed';

type Hold = {
  sessionKey: string;
  projectId: string;
  projectHash: string;
  snapshot: ProjectSnapshot;
};

let hold: Hold | null = null;
let hydrateP: Promise<void> | null = null;
let hydrateKey: string | null = null;
/** Bumped in {@link clearSnapHold} so stale GET /snapshot cannot apply after session switch. */
let epoch = 0;

export function snapEpoch(): number {
  return epoch;
}

export function snapKey(s: WorkspaceSession): string {
  return s.mode === 'remote' ? `r:${s.workerBaseUrl.replace(/\/$/, '')}:${s.projectId}` : `l:${s.local.snapshot.projectId}`;
}

export function clearSnapHold(): void {
  epoch += 1;
  hold = null;
  hydrateP = null;
  hydrateKey = null;
}

function curls(ws: WorkspaceSession & { mode: 'remote' }): SnapCurls {
  const base = ws.workerBaseUrl.replace(/\/$/, '');
  const pid = ws.projectId;
  return {
    metadata: `curl -sS "${base}/v1/projects/${pid}"`,
    tree: `curl -sS "${base}/v1/projects/${pid}/tree"`,
    locales: `curl -sS "${base}/v1/projects/${pid}/locales"`,
    doctor: `curl -sS "${base}/v1/projects/${pid}/doctor"`,
  };
}

function applyEnv(ws: WorkspaceSession & { mode: 'remote' }, env: WorkerApiEnvelope<unknown>): void {
  if (!env.success || env.data == null) return;
  const raw = env.data as { projectId?: string; snapshot?: ProjectSnapshot };
  if (!raw.snapshot) return;
  const sessionKey = snapKey(ws);
  hold = {
    sessionKey,
    projectId: raw.projectId ?? ws.projectId,
    projectHash: raw.snapshot.projectHash,
    snapshot: raw.snapshot,
  };
  seedOpMemoFromSnap(ws, env, curls(ws));
}

/**
 * Replace hold from a fresh snapshot envelope (explicit Snapshot button).
 * @param epochGuard If set, must still equal current epoch after await or apply is skipped.
 */
export function setSnapFromEnv(ws: WorkspaceSession, env: WorkerApiEnvelope<unknown>, epochGuard?: number): void {
  if (ws.mode !== 'remote') return;
  if (epochGuard !== undefined && epochGuard !== epoch) return;
  applyEnv(ws, env);
}

/** Synthetic ParsedProjectUpload for localWorkerShim (textFiles unused by read-only ops). */
export function snapBackedLocal(ws: WorkspaceSession): ParsedProjectUpload | null {
  if (ws.mode === 'local') return ws.local;
  if (!hold || hold.sessionKey !== snapKey(ws)) return null;
  return {
    snapshot: hold.snapshot,
    textFiles: {},
  };
}

/** One GET /snapshot per remote session key; deduped in-flight. */
export async function snapHydrateRemote(ws: WorkspaceSession): Promise<void> {
  if (ws.mode !== 'remote') return;
  const key = snapKey(ws);
  if (hold?.sessionKey === key) return;
  if (hydrateP && hydrateKey === key) {
    await hydrateP;
    return;
  }
  const e0 = epoch;
  hydrateKey = key;
  hydrateP = (async () => {
    try {
      const res = await getProjectSnapshot(ws.workerBaseUrl, ws.projectId);
      if (e0 !== epoch) return;
      applyEnv(ws, res as WorkerApiEnvelope<unknown>);
    } catch {
      if (e0 === epoch) hold = null;
    } finally {
      hydrateP = null;
      hydrateKey = null;
    }
  })();
  await hydrateP;
}
