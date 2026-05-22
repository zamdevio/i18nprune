import type { RuntimePathPort } from '../../types/runtime/path.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { PrepareProjectSnapshotResult } from '../../types/project/prepare.js';
import { parseProjectUploadFailure } from '../normalizeConfig.js';
import { parseZipToSnapshot } from '../parseZip.js';
import { createArchiveProjectFs } from './archiveFs.js';
import { fillProjectSnapshotExtraction } from './extract.js';
import { createPrepareTimer } from './timing.js';

function toIssue(code: string, message: string): Issue {
  return { severity: 'error', code, message };
}

export type PrepareProjectSnapshotFromArchiveInput = {
  projectId: string;
  projectHash: string;
  zipBytes: Uint8Array;
  path: RuntimePathPort;
  configJson?: string;
  prepareHost?: string;
  requestReceivedAt?: string;
};

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

  return {
    ok: true,
    parsed: parsedUpload,
    prepareMeta: timer.finish(input.prepareHost),
  };
}
