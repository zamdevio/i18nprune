import type { WorkerHealthResult } from '@i18nprune/core';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

export async function checkWorkerHealth(workerBaseUrl: string): Promise<WorkerHealthResult> {
  const base = normalizeBaseUrl(workerBaseUrl);
  try {
    const resp = await fetch(`${base}/health`, { method: 'GET' });
    const body = (await resp.json()) as { success?: boolean; errors?: Array<{ message?: string }> };
    if (!resp.ok || body?.success === false) {
      const msg = body?.errors?.[0]?.message ?? `HTTP ${resp.status}`;
      return { ok: false, message: msg };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
