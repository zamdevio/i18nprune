import { checkWorkerHealth } from './health';

type GateState = { url: string; ok: boolean; at: number };

const TTL_MS = 30_000;
let last: GateState | null = null;

export function invalidateWorkerGate(url?: string): void {
  if (!url || last?.url === url) last = null;
}

export async function ensureWorkerReachable(workerBaseUrl: string): Promise<void> {
  const trimmed = workerBaseUrl.trim();
  if (!trimmed) throw new Error('Worker URL is empty.');
  const now = Date.now();
  if (last && last.url === trimmed && now - last.at < TTL_MS && last.ok) return;
  const r = await checkWorkerHealth(trimmed);
  last = { url: trimmed, ok: r.ok, at: now };
  if (!r.ok) {
    throw new Error(r.ok === false ? r.message : 'Worker health check failed');
  }
}
