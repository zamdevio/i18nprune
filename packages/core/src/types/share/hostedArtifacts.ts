import type { Issue } from '../json/envelope/index.js';
import type { HostedProjectIngestEnvelope } from '../project/prepare/index.js';
import type { ShareProjectManifest, ShareReportManifest } from './manifest.js';

export type HostedProjectShareArtifacts = {
  envelope: HostedProjectIngestEnvelope;
  serialized: string;
  manifest: ShareProjectManifest;
};

export type BuildHostedProjectShareArtifactsResult =
  | ({ ok: true } & HostedProjectShareArtifacts)
  | { ok: false; issues: Issue[] };

export type HostedReportShareArtifacts = {
  document: unknown;
  manifest: ShareReportManifest;
};
