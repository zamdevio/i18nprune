import { normalizeWorkerBaseUrl } from '../../share/policy/policy.js';
import type { HostedProjectIngestEnvelope } from '../../types/project/prepare/index.js';
import {
  resolveShareUploadForce,
  serializeHostedProjectIngestBody,
  serializeHostedReportIngestBody,
  withHostedProjectIngestForce,
  workerProjectIngestUrl,
  workerReportIngestUrl,
} from './ingestForce.js';

export function buildHostedProjectUploadRequest(input: {
  workerBaseUrl: string;
  envelope: HostedProjectIngestEnvelope;
  serialized: string;
  force?: boolean;
}): { url: string; body: string } {
  const force = resolveShareUploadForce(input.force);
  const base = normalizeWorkerBaseUrl(input.workerBaseUrl);
  return {
    url: workerProjectIngestUrl(base, force),
    body: serializeHostedProjectIngestBody(withHostedProjectIngestForce(input.envelope, force), force),
  };
}

export function buildHostedReportUploadRequest(input: {
  workerBaseUrl: string;
  document: unknown;
  force?: boolean;
}): { url: string; body: string } {
  const force = resolveShareUploadForce(input.force);
  const base = normalizeWorkerBaseUrl(input.workerBaseUrl);
  return {
    url: workerReportIngestUrl(base, force),
    body: serializeHostedReportIngestBody(input.document, force),
  };
}
