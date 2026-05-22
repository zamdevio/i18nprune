import type { ProjectSnapshot, ProjectStoreRow, ReportStoreRow } from '@i18nprune/core';
import { PROJECT_CACHE_IDLE_MS, PROJECT_CACHE_SWEEP_INTERVAL_MS } from './constants/retention';
import {
  DO_PREFIX_PROJECT,
  DO_PREFIX_PROJECT_HASH,
  DO_PREFIX_REPORT,
  DO_PREFIX_REPORT_HASH,
} from './constants/storageKeys.js';
import { uploadRateLimitDecision, type UploadRateLimitCounts } from './rateLimit/policy.js';
import { putWithStorageRecovery, StoragePressureError } from './storage/pressure.js';

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

  private projectHashKey(hash: string): string {
    return `${DO_PREFIX_PROJECT_HASH}${hash}`;
  }

  private async resolveProjectIdByHash(hash: string): Promise<string | null> {
    const projectId = await this.state.storage.get<string>(this.projectHashKey(hash));
    return projectId ?? null;
  }

  /** Idempotent: drops `projecthash:*` and `project:*` for this content hash (missing keys are OK). */
  private async purgeProjectByContentHash(hash: string): Promise<void> {
    const projectId = await this.state.storage.get<string>(this.projectHashKey(hash));
    if (projectId) {
      const row = await this.state.storage.get<ProjectStoreRow>(`${DO_PREFIX_PROJECT}${projectId}`);
      if (row) {
        await this.state.storage.delete(this.projectHashKey(row.projectHash));
      }
      await this.state.storage.delete(`${DO_PREFIX_PROJECT}${projectId}`);
    }
    await this.state.storage.delete(this.projectHashKey(hash));
  }

  private async purgeReportByPayloadHash(hash: string): Promise<void> {
    const reportId = await this.state.storage.get<string>(`${DO_PREFIX_REPORT_HASH}${hash}`);
    if (reportId) {
      const row = await this.state.storage.get<ReportStoreRow>(`${DO_PREFIX_REPORT}${reportId}`);
      if (row) {
        await this.state.storage.delete(`${DO_PREFIX_REPORT_HASH}${row.payloadContentHash}`);
      }
      await this.state.storage.delete(`${DO_PREFIX_REPORT}${reportId}`);
    }
    await this.state.storage.delete(`${DO_PREFIX_REPORT_HASH}${hash}`);
  }

  private async touchProjectRow(row: ProjectStoreRow): Promise<ProjectStoreRow> {
    const touched: ProjectStoreRow = { ...row, lastAccessedAt: new Date().toISOString() };
    await putWithStorageRecovery(this.state, this.projectHashKey(touched.projectHash), touched.projectId);
    await putWithStorageRecovery(this.state, `${DO_PREFIX_PROJECT}${touched.projectId}`, touched);
    await this.scheduleRetentionSweep();
    return touched;
  }

  private async touchReportRow(row: ReportStoreRow): Promise<ReportStoreRow> {
    const touched: ReportStoreRow = { ...row, lastAccessedAt: new Date().toISOString() };
    await putWithStorageRecovery(this.state, `${DO_PREFIX_REPORT_HASH}${touched.payloadContentHash}`, touched.reportId);
    await putWithStorageRecovery(this.state, `${DO_PREFIX_REPORT}${touched.reportId}`, touched);
    await this.scheduleRetentionSweep();
    return touched;
  }

  private async sweepPrefix<T extends { lastAccessedAt?: string; storedAt?: string }>(
    prefix: string,
    onDelete: (key: string, row: T) => Promise<void>,
  ): Promise<void> {
    const cutoff = Date.now() - PROJECT_CACHE_IDLE_MS;
    let startAfter: string | undefined;
    for (;;) {
      const map = await this.state.storage.list<T>({
        prefix,
        limit: 64,
        ...(startAfter ? { startAfter } : {}),
      });
      if (map.size === 0) break;
      let lastKey: string | undefined;
      for (const [key, row] of map) {
        lastKey = key;
        const lastStr = row.lastAccessedAt ?? row.storedAt;
        const last = lastStr ? new Date(lastStr).getTime() : 0;
        if (last < cutoff) {
          await onDelete(key, row);
        }
      }
      if (map.size < 64) break;
      if (!lastKey) break;
      startAfter = lastKey;
    }
  }

  /** Deletes idle `project:*` and `projecthash:*` rows. */
  private async sweepExpiredProjects(): Promise<void> {
    await this.sweepPrefix<ProjectStoreRow>(DO_PREFIX_PROJECT, async (key, row) => {
      await this.state.storage.delete(this.projectHashKey(row.projectHash));
      await this.state.storage.delete(key);
    });
  }

  /** Deletes idle `report:*` and `reporthash:*` rows. */
  private async sweepExpiredReports(): Promise<void> {
    await this.sweepPrefix<ReportStoreRow>(DO_PREFIX_REPORT, async (key, row) => {
      await this.state.storage.delete(`${DO_PREFIX_REPORT_HASH}${row.payloadContentHash}`);
      await this.state.storage.delete(key);
    });
  }

  private async hasAnyCachedRows(): Promise<boolean> {
    const projects = await this.state.storage.list({ prefix: DO_PREFIX_PROJECT, limit: 1 });
    if (projects.size > 0) return true;
    const reports = await this.state.storage.list({ prefix: DO_PREFIX_REPORT, limit: 1 });
    return reports.size > 0;
  }

  private storageErrorResponse(err: StoragePressureError): Response {
    return Response.json(
      {
        ok: false,
        code: err.code,
        message: err.message,
        evictionAttempted: err.evictionAttempted,
      },
      { status: 507 },
    );
  }

  async alarm(): Promise<void> {
    await this.sweepExpiredProjects();
    await this.sweepExpiredReports();
    if (!(await this.hasAnyCachedRows())) {
      await this.state.storage.deleteAlarm();
      return;
    }
    await this.state.storage.setAlarm(Date.now() + PROJECT_CACHE_SWEEP_INTERVAL_MS);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const p = url.pathname;
    try {
      if (request.method === 'GET' && p === '/health') {
        return Response.json({ ok: true });
      }
      if (request.method === 'GET' && p.startsWith('/projecthash/')) {
        const hash = decodeURIComponent(p.slice('/projecthash/'.length));
        const projectId = await this.resolveProjectIdByHash(hash);
        if (!projectId) {
          return Response.json({ projectId: null });
        }
        const row = await this.state.storage.get<ProjectStoreRow>(`${DO_PREFIX_PROJECT}${projectId}`);
        if (!row) {
          await this.state.storage.delete(this.projectHashKey(hash));
          return Response.json({ projectId: null });
        }
        return Response.json({ projectId });
      }
      if (request.method === 'DELETE' && p.startsWith('/projecthash/')) {
        const hash = decodeURIComponent(p.slice('/projecthash/'.length));
        await this.purgeProjectByContentHash(hash);
        return Response.json({ ok: true });
      }
      if (request.method === 'GET' && p.startsWith('/project/')) {
        const projectId = decodeURIComponent(p.slice('/project/'.length));
        const row = await this.state.storage.get<ProjectStoreRow>(`${DO_PREFIX_PROJECT}${projectId}`);
        if (!row) {
          return Response.json({ project: null });
        }
        const touched = await this.touchProjectRow(row);
        return Response.json({ project: touched });
      }
      if (request.method === 'POST' && p === '/ratelimit/upload') {
        const body = (await request.json()) as { ip?: string };
        const ip = typeof body.ip === 'string' && body.ip.length > 0 ? body.ip : 'unknown';
        const hourSlot = Math.floor(Date.now() / 3_600_000);
        const daySlot = Math.floor(Date.now() / 86_400_000);
        const hourKey = `ratelimit:${ip}:h:${String(hourSlot)}`;
        const dayKey = `ratelimit:${ip}:d:${String(daySlot)}`;
        const hour = ((await this.state.storage.get<number>(hourKey)) ?? 0) + 1;
        const day = ((await this.state.storage.get<number>(dayKey)) ?? 0) + 1;
        await putWithStorageRecovery(this.state, hourKey, hour);
        await putWithStorageRecovery(this.state, dayKey, day);
        const decision = uploadRateLimitDecision({ hour, day } satisfies UploadRateLimitCounts);
        if (!decision.allowed) {
          return Response.json(
            { allowed: false, retryAfterSeconds: decision.retryAfterSeconds },
            { status: 429 },
          );
        }
        return Response.json({ allowed: true });
      }
      if (request.method === 'PUT' && p === '/project') {
        const row = (await request.json()) as ProjectStoreRow;
        const touched = await this.touchProjectRow(row);
        return Response.json({ ok: true, projectId: touched.projectId });
      }
      if (request.method === 'DELETE' && p.startsWith('/project/')) {
        const projectId = decodeURIComponent(p.slice('/project/'.length));
        const row = await this.state.storage.get<ProjectStoreRow>(`${DO_PREFIX_PROJECT}${projectId}`);
        if (row?.projectHash) {
          await this.state.storage.delete(this.projectHashKey(row.projectHash));
        }
        await this.state.storage.delete(`${DO_PREFIX_PROJECT}${projectId}`);
        return Response.json({ ok: true, existed: Boolean(row) });
      }
      if (request.method === 'GET' && p.startsWith('/reporthash/')) {
        const hash = decodeURIComponent(p.slice('/reporthash/'.length));
        const reportId = await this.state.storage.get<string>(`${DO_PREFIX_REPORT_HASH}${hash}`);
        if (!reportId) {
          return Response.json({ reportId: null });
        }
        const row = await this.state.storage.get<ReportStoreRow>(`${DO_PREFIX_REPORT}${reportId}`);
        if (!row) {
          await this.state.storage.delete(`${DO_PREFIX_REPORT_HASH}${hash}`);
          return Response.json({ reportId: null });
        }
        return Response.json({ reportId });
      }
      if (request.method === 'DELETE' && p.startsWith('/reporthash/')) {
        const hash = decodeURIComponent(p.slice('/reporthash/'.length));
        await this.purgeReportByPayloadHash(hash);
        return Response.json({ ok: true });
      }
      if (request.method === 'GET' && p.startsWith('/report/')) {
        const reportId = decodeURIComponent(p.slice('/report/'.length));
        const row = await this.state.storage.get<ReportStoreRow>(`${DO_PREFIX_REPORT}${reportId}`);
        if (!row) {
          return Response.json({ report: null });
        }
        const touched = await this.touchReportRow(row);
        return Response.json({ report: touched });
      }
      if (request.method === 'PUT' && p === '/report') {
        const row = (await request.json()) as ReportStoreRow;
        const touched = await this.touchReportRow(row);
        return Response.json({ ok: true, reportId: touched.reportId });
      }
      if (request.method === 'DELETE' && p.startsWith('/report/')) {
        const reportId = decodeURIComponent(p.slice('/report/'.length));
        const row = await this.state.storage.get<ReportStoreRow>(`${DO_PREFIX_REPORT}${reportId}`);
        if (row?.payloadContentHash) {
          await this.state.storage.delete(`${DO_PREFIX_REPORT_HASH}${row.payloadContentHash}`);
        }
        await this.state.storage.delete(`${DO_PREFIX_REPORT}${reportId}`);
        return Response.json({ ok: true, existed: Boolean(row) });
      }
      return new Response('Not found', { status: 404 });
    } catch (err) {
      if (err instanceof StoragePressureError) {
        return this.storageErrorResponse(err);
      }
      throw err;
    }
  }
}

export type { ProjectSnapshot, ProjectStoreRow, ReportStoreRow };
