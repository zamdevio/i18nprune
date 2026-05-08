import type { ProjectSnapshot } from './project';
import { PROJECT_CACHE_IDLE_MS, PROJECT_CACHE_SWEEP_INTERVAL_MS } from './constants/retention';

export type ProjectStoreRow = {
  projectId: string;
  projectHash: string;
  snapshot: ProjectSnapshot;
  /** ISO timestamp — updated on upload and on every successful project read; drives idle eviction. */
  lastAccessedAt?: string;
};

export class ProjectStoreDO {
  state: DurableObjectState;
  constructor(state: DurableObjectState) {
    this.state = state;
  }

  private async scheduleRetentionSweep(): Promise<void> {
    const when = Date.now() + PROJECT_CACHE_SWEEP_INTERVAL_MS;
    const current = await this.state.storage.getAlarm();
    if (current === null || current > when) {
      await this.state.storage.setAlarm(when);
    }
  }

  private async touchProjectRow(row: ProjectStoreRow): Promise<ProjectStoreRow> {
    const touched: ProjectStoreRow = { ...row, lastAccessedAt: new Date().toISOString() };
    await this.state.storage.put(`hash:${touched.projectHash}`, touched.projectId);
    await this.state.storage.put(`project:${touched.projectId}`, touched);
    await this.scheduleRetentionSweep();
    return touched;
  }

  /** Deletes `project:*` rows (and matching `hash:*`) with no access for {@link PROJECT_CACHE_IDLE_MS}. */
  private async sweepExpiredProjects(): Promise<void> {
    const cutoff = Date.now() - PROJECT_CACHE_IDLE_MS;
    let startAfter: string | undefined;
    for (;;) {
      const map = await this.state.storage.list<ProjectStoreRow>({
        prefix: 'project:',
        limit: 64,
        ...(startAfter ? { startAfter } : {}),
      });
      if (map.size === 0) break;
      let lastKey: string | undefined;
      for (const [key, row] of map) {
        lastKey = key;
        const lastStr = row.lastAccessedAt ?? row.snapshot?.uploadedAt;
        const last = lastStr ? new Date(lastStr).getTime() : 0;
        if (last < cutoff) {
          await this.state.storage.delete(`hash:${row.projectHash}`);
          await this.state.storage.delete(key);
        }
      }
      if (map.size < 64) break;
      if (!lastKey) break;
      startAfter = lastKey;
    }
  }

  async alarm(): Promise<void> {
    await this.sweepExpiredProjects();
    const next = await this.state.storage.list({ prefix: 'project:', limit: 1 });
    if (next.size === 0) {
      await this.state.storage.deleteAlarm();
      return;
    }
    await this.state.storage.setAlarm(Date.now() + PROJECT_CACHE_SWEEP_INTERVAL_MS);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const p = url.pathname;
    if (request.method === 'GET' && p === '/health') {
      return Response.json({ ok: true });
    }
    if (request.method === 'GET' && p.startsWith('/hash/')) {
      const hash = decodeURIComponent(p.slice('/hash/'.length));
      const projectId = await this.state.storage.get<string>(`hash:${hash}`);
      if (!projectId) {
        return Response.json({ projectId: null });
      }
      const row = await this.state.storage.get<ProjectStoreRow>(`project:${projectId}`);
      if (!row) {
        return Response.json({ projectId: null });
      }
      await this.touchProjectRow(row);
      return Response.json({ projectId });
    }
    if (request.method === 'GET' && p.startsWith('/project/')) {
      const projectId = decodeURIComponent(p.slice('/project/'.length));
      const row = await this.state.storage.get<ProjectStoreRow>(`project:${projectId}`);
      if (!row) {
        return Response.json({ project: null });
      }
      const touched = await this.touchProjectRow(row);
      return Response.json({ project: touched });
    }
    if (request.method === 'PUT' && p === '/project') {
      const row = (await request.json()) as ProjectStoreRow;
      const touched = await this.touchProjectRow(row);
      return Response.json({ ok: true, projectId: touched.projectId });
    }
    if (request.method === 'DELETE' && p.startsWith('/project/')) {
      const projectId = decodeURIComponent(p.slice('/project/'.length));
      const row = await this.state.storage.get<ProjectStoreRow>(`project:${projectId}`);
      if (row) {
        await this.state.storage.delete(`hash:${row.projectHash}`);
      }
      await this.state.storage.delete(`project:${projectId}`);
      return Response.json({ ok: true, existed: Boolean(row) });
    }
    return new Response('Not found', { status: 404 });
  }
}
