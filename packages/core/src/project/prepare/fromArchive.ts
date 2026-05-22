import type { Issue } from '../../types/json/envelope/index.js';
import type { PrepareProjectSnapshotResult } from '../../types/project/prepare.js';
import type { PrepareProjectSnapshotFromArchiveInput } from '../../types/project/prepareArchive.js';
import { parseProjectUploadFailure } from '../normalizeConfig.js';
import { parseZipToSnapshot } from '../parseZip.js';
import { createArchiveProjectFs } from './archiveFs.js';
import { fillProjectSnapshotExtraction } from './extract.js';
import { METADATA_DASH } from '../../types/project/metadata.js';
import type { HostPrepareCacheMeta } from '../../types/project/metadata.js';
import { createPrepareTimer } from './timing.js';

const ARCHIVE_HOST_CACHE: HostPrepareCacheMeta = {
  analysis: 'disabled',
  analysisReason: 'archive_ingest_no_project_cache',
  timingsTrustworthy: true,
  filesEpoch: METADATA_DASH,
  projectCacheEnabled: false,
};

function toIssue(code: string, message: string): Issue {
  return { severity: 'error', code, message };
}

/**
 * Zip secondary mode: parse archive bytes then run shared extraction (same pipeline as CLI/web prepare).
 */
export async function prepareProjectSnapshotFromArchive(
  input: PrepareProjectSnapshotFromArchiveInput,
): Promise<PrepareProjectSnapshotResult> {
  const timer = createPrepareTimer();

  let parsedUpload: ReturnType<typeof parseZipToSnapshot>;
  try {
    parsedUpload = parseZipToSnapshot(input.projectId, input.projectHash, input.zipBytes);
  } catch (cause) {
    const parsed = parseProjectUploadFailure(cause);
    return { ok: false, issues: [toIssue(parsed.code, parsed.message)] };
  }

  timer.mark('zipParsed');
  const { snapshot, textFiles } = parsedUpload;
  if (input.requestReceivedAt) snapshot.requestReceivedAt = input.requestReceivedAt;

  const fs = createArchiveProjectFs(textFiles, input.path);
  const filled = await fillProjectSnapshotExtraction({
    snapshot,
    textFiles,
    fs,
    configOverride: input.configJson,
  });

  timer.mark('extractionDone');

  if (!filled.ok) {
    return { ok: false, issues: [toIssue(filled.code, filled.message)] };
  }

  const prepareMeta = timer.finish(input.prepareHost);
  prepareMeta.hostCache = ARCHIVE_HOST_CACHE;

  return {
    ok: true,
    parsed: parsedUpload,
    prepareMeta,
  };
}
