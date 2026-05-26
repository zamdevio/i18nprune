import { HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION } from '../../shared/constants/project.js';
import type { HostedIngestProcessorContext } from '../../types/project/metadata.js';
import type { HostedProjectIngestEnvelope } from '../../types/project/prepare.js';
import type { PrepareProjectSnapshotResult } from '../../types/project/prepare.js';
import type { ValidateReportIngestResult } from '../../types/report/ingest.js';
import type { ShareProjectManifest } from '../../types/share/manifest.js';
import type {
  BuildHostedProjectShareArtifactsResult,
  HostedReportShareArtifacts,
} from '../../types/share/hostedArtifacts.js';
import { computeShareProjectConfigHash } from './buildProjectPayload.js';
import { assertHostedProjectPreparedWithinLimit } from './limits.js';
import type { CoreContext } from '../../types/context/index.js';
import { hostedIngestEnvelopeForShareContentHash } from './hostedSnapshotSemantic.js';
import { sha256HexBytes } from '../util/sha256.js';
import { stableStringify } from '../util/stableJson.js';

const PREPARED_INGEST_LABEL = 'prepared snapshot (hosted JSON ingest)';

function utf8Bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function topLevelPrefixesFromSnapshot(snapshot: { tree: readonly { path: string }[] }): string[] {
  const set = new Set<string>();
  for (const node of snapshot.tree) {
    const first = node.path.split('/')[0];
    if (first) set.add(first);
    if (set.size >= 20) break;
  }
  return [...set].sort();
}

/** Builds upload envelope + share manifest from an already-prepared project snapshot. */
export async function buildHostedProjectShareArtifacts(input: {
  ctx: CoreContext;
  prepare: PrepareProjectSnapshotResult & { ok: true };
  processorContext?: HostedIngestProcessorContext;
}): Promise<BuildHostedProjectShareArtifactsResult> {
  const envelope: HostedProjectIngestEnvelope = {
    schemaVersion: HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION,
    snapshot: input.prepare.parsed.snapshot,
    prepareMeta: input.prepare.prepareMeta,
    ...(input.processorContext ? { processorContext: input.processorContext } : {}),
  };

  const semanticCanonical = stableStringify(hostedIngestEnvelopeForShareContentHash(envelope));
  const payloadContentHash = await sha256HexBytes(utf8Bytes(semanticCanonical));
  envelope.snapshot.projectHash = payloadContentHash;

  const serialized = stableStringify(envelope);
  const uploadBytes = utf8Bytes(serialized);
  const preparedTooLarge = assertHostedProjectPreparedWithinLimit(uploadBytes.byteLength);
  if (preparedTooLarge) {
    return { ok: false, issues: [preparedTooLarge] };
  }

  const manifest: ShareProjectManifest = {
    kind: 'project',
    fileCount: envelope.snapshot.fileCount,
    textFileCount: envelope.snapshot.textFileCount,
    byteSize: uploadBytes.byteLength,
    topLevelPrefixes: topLevelPrefixesFromSnapshot(envelope.snapshot),
    appliedZipIgnoresLabel: PREPARED_INGEST_LABEL,
    payloadContentHash,
    configHash: computeShareProjectConfigHash(input.ctx),
    detectedConfigRelPath: envelope.snapshot.detectedConfigPath,
  };

  return { ok: true, envelope, serialized, manifest };
}

/** Report branch from combined {@link prepareShareHostedFromContext}. */
export function buildHostedReportShareArtifacts(
  report: ValidateReportIngestResult & { ok: true },
): HostedReportShareArtifacts {
  return { document: report.document, manifest: report.manifest };
}
