/**
 * Prepared project snapshot manifest (zip not included — described by hashes + counts).
 * Report manifests land in slice row 2.
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

/** Union for future report manifests. */
export type ShareManifest = ShareProjectManifest;
