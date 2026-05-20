import type { ProjectTreeNode } from './tree.js';

export type ProjectUploadFileMeta = {
  path: string;
  kind: 'file';
  size: number;
  ext: string;
  mimeGuess: string;
  textLike: boolean;
};

export type ProjectUploadExtractionSummary = {
  configHash: string;
  sourceLocalePath: string;
  srcRoot: string;
  localesDir: string;
  resolvedKeys: string[];
  keyObservationsCount: number;
  dynamicSitesCount: number;
  keyObservationsPreview: unknown[];
  dynamicSitesPreview: unknown[];
  computedAt: string;
};

/** Parsed project zip snapshot (worker DO + web local session). */
export type ProjectSnapshot = {
  projectId: string;
  projectHash: string;
  uploadedAt: string;
  zipBytes: number;
  fileCount: number;
  textFileCount: number;
  detectedConfigPath: string | null;
  detectedConfigRaw: string | null;
  tree: ProjectTreeNode[];
  resolvedConfig: Record<string, unknown> | null;
  sourceLocaleJson: Record<string, unknown> | null;
  localeJsonByTag: Record<string, Record<string, unknown>>;
  extraction: ProjectUploadExtractionSummary | null;
};

export type ParsedProjectUpload = {
  snapshot: ProjectSnapshot;
  textFiles: Record<string, string>;
};
