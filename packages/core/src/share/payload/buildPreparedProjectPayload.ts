import { HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION } from '../../shared/constants/project.js';
import { hex16Id } from '../../project/id.js';
import { prepareProjectSnapshotFromRoot } from '../../project/prepare/fromRoot.js';
import type { HostedProjectIngestEnvelope } from '../../types/project/prepare/index.js';
import type {
  BuildPreparedProjectPayloadInput,
  BuildPreparedProjectPayloadResult,
} from '../../types/share/payload.js';
import type { ShareProjectManifest } from '../../types/share/manifest.js';
import { computeShareProjectConfigHash } from './buildProjectPayload.js';
import { assertHostedProjectPreparedWithinLimit } from './limits.js';
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

/**
 * Disk prepare + hosted ingest envelope for primary `POST /v1/projects` JSON upload.
 */
export async function buildPreparedProjectPayload(
  input: BuildPreparedProjectPayloadInput,
): Promise<BuildPreparedProjectPayloadResult> {
  const projectId = hex16Id();
  const prepare = await prepareProjectSnapshotFromRoot({
    ctx: input.ctx,
    projectRoot: input.projectRoot,
    projectId,
    projectHash: '0'.repeat(64),
    prepareHost: input.prepareHost ?? 'cli-share',
    requestReceivedAt: input.requestReceivedAt,
    analysisOpts: input.analysisOpts,
  });
  if (!prepare.ok) return { ok: false, issues: prepare.issues };

  const envelope: HostedProjectIngestEnvelope = {
    schemaVersion: HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION,
    snapshot: prepare.parsed.snapshot,
    prepareMeta: prepare.prepareMeta,
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
  const configHash = computeShareProjectConfigHash(input.ctx);

  const manifest: ShareProjectManifest = {
    kind: 'project',
    fileCount: envelope.snapshot.fileCount,
    textFileCount: envelope.snapshot.textFileCount,
    byteSize: uploadBytes.byteLength,
    topLevelPrefixes: topLevelPrefixesFromSnapshot(envelope.snapshot),
    appliedZipIgnoresLabel: PREPARED_INGEST_LABEL,
    payloadContentHash,
    configHash,
    detectedConfigRelPath: envelope.snapshot.detectedConfigPath,
  };

  return { ok: true, envelope, serialized, manifest, prepare };
}
