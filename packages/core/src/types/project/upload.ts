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
  /** ISO timestamp immediately before key/dynamic extraction scan. */
  extractionStartedAt?: string;
  /** ISO timestamp after locale map + previews are assembled. */
  computedAt: string;
};

/** Parsed project zip snapshot (worker DO + web local session). */
export type ProjectSnapshot = {
  projectId: string;
  projectHash: string;
  /** ISO timestamp when the upload handler received the request (before zip parse). */
  requestReceivedAt?: string;
  /** ISO timestamp when zip parse finished (`parseZipToSnapshot`). */
  uploadedAt: string;
  /** ISO timestamp when the DO row was persisted successfully. */
  storedAt?: string;
  zipBytes: number;
  fileCount: number;
  textFileCount: number;
  detectedConfigPath: string | null;
  detectedConfigRaw: string | null;
  tree: ProjectTreeNode[];
  resolvedConfig: Record<string, unknown> | null;
  sourceLocaleJson: Record<string, unknown> | null;
  localeJsonByTag: Record<string, Record<string, unknown>>;
  /** Locale codes discovered at prepare (flat_file or locale_directory layouts). */
  localeTags?: string[];
  extraction: ProjectUploadExtractionSummary | null;
};

export type ParsedProjectUpload = {
  snapshot: ProjectSnapshot;
  textFiles: Record<string, string>;
};
