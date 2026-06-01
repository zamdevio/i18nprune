import type { PrepareHostKind } from '../types/project/prepare/index.js';
import type { ReportEnvironmentSnapshot } from '../types/report/reportDocument.js';

/**
 * Environment block for reports built from a zip on a host without local project roots
 * (worker archive ingest, web zip import). Not a desktop Node scan — editor links stay unsupported.
 *
 * @remarks Empty `arch` / `nodeVersion` / `osRelease` omit from worker metadata display.
 * `platform` uses stable hosted labels recognized by the report viewer (`browser`, `cloudflare-workers`).
 */
export function archiveHostedReportEnvironment(prepareHost?: PrepareHostKind): ReportEnvironmentSnapshot {
  const platform = prepareHost === 'web' ? 'browser' : 'cloudflare-workers';
  return {
    platform,
    arch: '',
    nodeVersion: '',
    osRelease: '',
    runtimeFamily: 'edge-worker',
  };
}
