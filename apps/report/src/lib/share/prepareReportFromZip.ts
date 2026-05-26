import { hex16Id, prepareReportFromArchive, sha256HexBytes } from '@i18nprune/core';
import { webPathRuntime } from '@i18nprune/core/runtime/web';
import type { ProjectReportDocument } from '../../types/index.js';

export async function prepareReportDocumentFromZip(
  zipBytes: Uint8Array,
  options?: { configJson?: string },
): Promise<ProjectReportDocument> {
  const projectId = hex16Id();
  const projectHash = await sha256HexBytes(zipBytes);
  const prepared = await prepareReportFromArchive({
    projectId,
    projectHash,
    zipBytes,
    path: webPathRuntime,
    configJson: options?.configJson,
    prepareHost: 'web',
  });
  if (!prepared.ok) {
    const first = 'issues' in prepared ? prepared.issues[0] : null;
    throw new Error(first?.message ?? 'Failed to prepare report from zip.');
  }
  return prepared.document as ProjectReportDocument;
}
