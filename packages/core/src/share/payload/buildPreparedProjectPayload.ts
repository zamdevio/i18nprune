import { HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION } from '../../shared/constants/project.js';
import { hex16Id } from '../../project/id.js';
import { prepareProjectSnapshotFromRoot } from '../../project/prepare/fromRoot.js';
import type { CoreContext } from '../../types/context/index.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { HostedProjectIngestEnvelope, PrepareProjectSnapshotResult } from '../../types/project/prepare.js';
import type { PrepareProjectSnapshotFromRootInput } from '../../types/project/prepareRoot.js';
import type { ShareProjectManifest } from '../../types/share/manifest.js';
import type { ProjectAnalysisResolveOptions } from '../../types/analysis/index.js';
import { computeShareProjectConfigHash } from './buildProjectPayload.js';
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

export type BuildPreparedProjectPayloadResult =
  | {
      ok: true;
      envelope: HostedProjectIngestEnvelope;
      serialized: string;
      manifest: ShareProjectManifest;
      prepare: PrepareProjectSnapshotResult & { ok: true };
    }
  | { ok: false; issues: Issue[] };

export type BuildPreparedProjectPayloadInput = {
  ctx: CoreContext;
  projectRoot: string;
  analysisOpts?: Pick<ProjectAnalysisResolveOptions, 'emit' | 'runId'>;
  prepareHost?: PrepareProjectSnapshotFromRootInput['prepareHost'];
  requestReceivedAt?: string;
};

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
  };

  const semanticCanonical = stableStringify(hostedIngestEnvelopeForShareContentHash(envelope));
  const payloadContentHash = await sha256HexBytes(utf8Bytes(semanticCanonical));
  envelope.snapshot.projectHash = payloadContentHash;

  const serialized = stableStringify(envelope);
  const uploadBytes = utf8Bytes(serialized);
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
