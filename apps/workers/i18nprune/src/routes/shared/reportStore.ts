import type { ReportStoreRow } from '@i18nprune/core';
import { readDoStorageFailure } from './doResponse.js';

export async function getReportById(stub: DurableObjectStub, reportId: string): Promise<ReportStoreRow | null> {
  const resp = await stub.fetch(`https://do/report/${encodeURIComponent(reportId)}`);
  const body = (await resp.json()) as { report: ReportStoreRow | null };
  return body.report;
}

export async function putReport(stub: DurableObjectStub, row: ReportStoreRow): Promise<void> {
  const resp = await stub.fetch('https://do/report', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(row),
  });
  const storageFailure = await readDoStorageFailure(resp);
  if (storageFailure) {
    throw storageFailure;
  }
  if (!resp.ok) {
    throw new Error(`Report persist failed (HTTP ${String(resp.status)})`);
  }
}

export async function deleteReport(stub: DurableObjectStub, reportId: string): Promise<boolean> {
  const resp = await stub.fetch(`https://do/report/${encodeURIComponent(reportId)}`, { method: 'DELETE' });
  const body = (await resp.json()) as { ok: boolean; existed: boolean };
  return body.existed;
}
