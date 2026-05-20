/**
 * Remote tab hold: mirrors worker DO — one GET /snapshot payload, then slice like getProjectById routes.
 * No zip rescan; validate/review/report read snapshot.extraction + locale JSON only (same as `apps/workers/i18nprune` routes).
 */
import { parseWorkerShareEnvelope, type ParsedProjectUpload, type ProjectSnapshot, type WorkerApiEnvelope, type WorkspaceSession } from '@i18nprune/core';
import { workerFetchJson } from '../services/share/workerHttp';
import { seedOpMemoFromSnap, type SnapCurls } from './snapSeed';

type Hold = {
  sessionKey: string;
  projectId: string;
  projectHash: string;
  snapshot: ProjectSnapshot;
};

let hold: Hold | null = null;
let hydrateP: Promise<boolean> | null = null;
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

function applyEnv(ws: WorkspaceSession & { mode: 'remote' }, env: WorkerApiEnvelope<unknown>): boolean {
  if (!env.success || env.data == null) return false;
  const raw = env.data as { projectId?: string; snapshot?: ProjectSnapshot };
  if (!raw.snapshot) return false;
  const sessionKey = snapKey(ws);
  hold = {
    sessionKey,
    projectId: raw.projectId ?? ws.projectId,
    projectHash: raw.snapshot.projectHash,
    snapshot: raw.snapshot,
  };
  seedOpMemoFromSnap(ws, env, curls(ws));
  return true;
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

/** One GET /snapshot per remote session key; deduped in-flight. Returns true when hold is ready. */
export async function snapHydrateRemote(ws: WorkspaceSession): Promise<boolean> {
  if (ws.mode !== 'remote') return false;
  const key = snapKey(ws);
  if (hold?.sessionKey === key) return true;
  if (hydrateP && hydrateKey === key) {
    return hydrateP;
  }
  const e0 = epoch;
  const base = ws.workerBaseUrl.replace(/\/$/, '');
  hydrateKey = key;
  hydrateP = (async () => {
    try {
      const { httpStatus, body } = await workerFetchJson(
        `${base}/v1/projects/${encodeURIComponent(ws.projectId)}/snapshot`,
      );
      if (e0 !== epoch) return false;
      const envelope = parseWorkerShareEnvelope(body);
      if (httpStatus >= 200 && httpStatus < 300 && envelope.success) {
        return applyEnv(ws, envelope as WorkerApiEnvelope<unknown>);
      }
      if (e0 === epoch) hold = null;
      return false;
    } catch {
      if (e0 === epoch) hold = null;
      return false;
    } finally {
      hydrateP = null;
      hydrateKey = null;
    }
  })();
  return hydrateP;
}
