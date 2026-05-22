import { describe, expect, it } from 'vitest';
import {
  appendWorkerIngestForceQuery,
  coalesceWorkerIngestForce,
  resolveShareUploadForce,
  serializeHostedReportIngestBody,
} from '../ingestForce.js';

describe('worker ingest force', () => {
  it('defaults force to false', () => {
    expect(resolveShareUploadForce()).toBe(false);
    expect(resolveShareUploadForce(false)).toBe(false);
    expect(coalesceWorkerIngestForce({ query: 'false', bodyFlag: false })).toBe(false);
  });

  it('coalesces query and body force flags', () => {
    expect(coalesceWorkerIngestForce({ query: 'true' })).toBe(true);
    expect(coalesceWorkerIngestForce({ bodyFlag: true })).toBe(true);
    expect(appendWorkerIngestForceQuery('https://worker.example/v1/projects', true)).toContain('force=true');
  });

  it('serializes report body with force when requested', () => {
    const raw = serializeHostedReportIngestBody({ kind: 'i18nprune.projectReport' }, true);
    expect(JSON.parse(raw) as { force?: boolean }).toEqual({
      document: { kind: 'i18nprune.projectReport' },
      force: true,
    });
  });
});
