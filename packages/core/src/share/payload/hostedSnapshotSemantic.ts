import type { HostedProjectIngestEnvelope } from '../../types/project/prepare.js';
import type { ProjectSnapshot } from '../../types/project/upload.js';

function snapshotForShareContentHash(snapshot: ProjectSnapshot): Record<string, unknown> {
  const extraction = snapshot.extraction;
  return {
    zipBytes: snapshot.zipBytes,
    fileCount: snapshot.fileCount,
    textFileCount: snapshot.textFileCount,
    detectedConfigPath: snapshot.detectedConfigPath,
    tree: snapshot.tree,
    resolvedConfig: snapshot.resolvedConfig,
    sourceLocaleJson: snapshot.sourceLocaleJson,
    localeJsonByTag: snapshot.localeJsonByTag,
    ...(extraction
      ? {
          extraction: {
            configHash: extraction.configHash,
            sourceLocalePath: extraction.sourceLocalePath,
            srcRoot: extraction.srcRoot,
            localesDir: extraction.localesDir,
            resolvedKeys: extraction.resolvedKeys,
            keyObservationsCount: extraction.keyObservationsCount,
            dynamicSitesCount: extraction.dynamicSitesCount,
            keyObservationsPreview: extraction.keyObservationsPreview,
            dynamicSitesPreview: extraction.dynamicSitesPreview,
          },
        }
      : {}),
  };
}

/** Snapshot fields used for share skip policy (excludes per-run ids and timestamps). */
export function hostedSnapshotForShareContentHash(snapshot: ProjectSnapshot): Record<string, unknown> {
  return snapshotForShareContentHash(snapshot);
}

/** Ingest envelope fields hashed for share skip policy (excludes prepareMeta and volatile snapshot ids). */
export function hostedIngestEnvelopeForShareContentHash(
  envelope: HostedProjectIngestEnvelope,
): Record<string, unknown> {
  return {
    schemaVersion: envelope.schemaVersion,
    snapshot: snapshotForShareContentHash(envelope.snapshot),
  };
}
