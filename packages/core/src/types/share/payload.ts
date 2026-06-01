import type { ProjectAnalysisResolveOptions } from '../analysis/index.js';
import type { CoreContext } from '../context/index.js';
import type { Issue } from '../json/envelope/index.js';
import type {
  HostedProjectIngestEnvelope,
  PrepareProjectSnapshotFromRootInput,
  PrepareProjectSnapshotResult,
} from '../project/prepare/index.js';
import type { HostedIngestProcessorContext } from '../project/metadata.js';
import type { ShareProjectManifest } from './manifest.js';

export type BuildProjectPayloadResult =
  | { ok: true; zipBytes: Uint8Array; manifest: ShareProjectManifest }
  | { ok: false; issues: Issue[] };

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
  processorContext?: HostedIngestProcessorContext;
};

/** Issue emitted while assembling share zip bytes from collected paths. */
export type ShareZipBuildIssue = Issue;
