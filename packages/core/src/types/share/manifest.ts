/**
 * Prepared project snapshot manifest (zip not included — described by hashes + counts).
 */
export type ShareProjectManifest = {
  kind: 'project';
  fileCount: number;
  textFileCount: number;
  byteSize: number;
  /** Distinct first path segments (cap ~20) for human logs. */
  topLevelPrefixes: readonly string[];
  /** Short label describing built-in exclude rules (see `shouldSkipPathForShareZip`). */
  appliedZipIgnoresLabel: string;
  payloadContentHash: string;
  configHash: string;
  detectedConfigRelPath: string | null;
};

/** Prepared report payload manifest (validated `ProjectReportDocument` JSON). */
export type ShareReportManifest = {
  kind: 'report';
  byteSize: number;
  payloadContentHash: string;
  schemaVersion: number;
  toolVersion: string;
  generatedAt: string;
};

export type ShareManifest = ShareProjectManifest | ShareReportManifest;
