import type { Issue } from '../../types/json/envelope/index.js';
import type { PrepareProjectSnapshotResult } from '../../types/project/prepare/index.js';
import type { PrepareProjectSnapshotFromArchiveInput } from '../../types/project/prepare/index.js';
import { parseProjectUploadFailure } from '../normalizeConfig.js';
import { parseZipToSnapshot } from '../parseZip.js';
import { createArchiveProjectFs } from './archiveFs.js';
import { fillProjectSnapshotExtraction } from './extract.js';
import type { HostPrepareCacheMeta } from '../../types/project/metadata.js';
import { alignArchiveSnapshotTimings } from './alignArchiveTimings.js';
import { resolveArchiveInputFilesEpoch } from './resolveArchiveInputFilesEpoch.js';
import { createPrepareTimer } from './timing.js';

function archiveHostCache(filesEpoch: string | undefined): HostPrepareCacheMeta {
  return {
    analysis: 'disabled',
    analysisReason: 'archive_ingest_no_project_cache',
    timingsTrustworthy: true,
    filesEpoch: filesEpoch ?? null,
    projectCacheEnabled: false,
  };
}

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

  const zipWall0 = Date.now();
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
  const zipWallMs = Math.max(0, Date.now() - zipWall0);
  if ((prepareMeta.zipParsedMs ?? 0) <= 0 && zipWallMs > 0) {
    prepareMeta.zipParsedMs = zipWallMs;
  }
  if (input.requestReceivedAt) {
    const wallTotal = Math.max(0, Date.now() - Date.parse(input.requestReceivedAt));
    if (wallTotal > (prepareMeta.totalMs ?? 0)) {
      prepareMeta.totalMs = wallTotal;
      const zip = prepareMeta.zipParsedMs ?? 0;
      if ((prepareMeta.extractionMs ?? 0) <= 0) {
        prepareMeta.extractionMs = Math.max(0, wallTotal - zip);
      }
    }
  }
  alignArchiveSnapshotTimings({
    snapshot,
    requestReceivedAt: input.requestReceivedAt,
    prepareMeta,
  });
  const filesEpoch = await resolveArchiveInputFilesEpoch(textFiles);
  prepareMeta.hostCache = archiveHostCache(filesEpoch);

  return {
    ok: true,
    parsed: parsedUpload,
    prepareMeta,
  };
}
