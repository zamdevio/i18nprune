import {
  prepareProjectSnapshotFromArchive,
  type ParsedProjectUpload,
} from '@i18nprune/core';
import { webPathRuntime } from '@i18nprune/core/runtime/web';
import { hex16Id, sha256Hex } from './cryptoUtils';

/**
 * Parse + extract a project zip in the browser using the same prepare pipeline as CLI/worker prepared ingest.
 */
export async function buildLocalProjectFromZip(
  zipBytes: Uint8Array,
  options?: { configJson?: string },
): Promise<ParsedProjectUpload> {
  const projectId = hex16Id();
  const projectHash = await sha256Hex(zipBytes);
  const prepared = await prepareProjectSnapshotFromArchive({
    projectId,
    projectHash,
    zipBytes,
    path: webPathRuntime,
    configJson: options?.configJson,
    prepareHost: 'web',
  });
  if (!prepared.ok) {
    const first = prepared.issues[0];
    throw new Error(first?.message ?? 'Failed to prepare project from zip.');
  }
  return prepared.parsed;
}

// Re-export local op helpers from dedicated module (unchanged API for workspace ops).
export {
  localValidateData,
  localReviewData,
  localMissingData,
  localReportData,
} from './localProjectOps';
