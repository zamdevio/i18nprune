export type WorkerApiErrorItem = {
  code: string;
  message: string;
  details?: unknown;
};

export type WorkerApiWarningItem = {
  code: string;
  message: string;
  details?: unknown;
};

/** JSON envelope for `apps/workers/i18nprune` HTTP routes (distinct from CLI `CliJsonEnvelope`). */
export type WorkerApiEnvelope<T> = {
  code: string;
  success: boolean;
  data: T | null;
  errors: WorkerApiErrorItem[];
  warnings: WorkerApiWarningItem[];
  timestamp: string;
  meta?: Record<string, unknown>;
};

export type ProjectUploadSnapshotMeta = {
  requestReceivedAt: string;
  uploadedAt: string;
  extractionStartedAt: string;
  extractionComputedAt: string;
  storedAt: string;
  fileCount: number;
  textFileCount: number;
  detectedConfigPath: string | null;
  extractionReady: boolean;
  /** Wall time for key/dynamic extraction scan (`extractionStartedAt` → `extractionComputedAt`). */
  extractionMs?: number;
  /** Wall time for DO persist (`extractionComputedAt` → `storedAt`). */
  persistMs?: number;
  /** Wall time for full upload handler (`requestReceivedAt` → `storedAt`). */
  totalMs?: number;
};

export type ProjectUploadResponse = {
  projectId: string;
  snapshotMeta: ProjectUploadSnapshotMeta;
};

export type WorkerHealthResult = { ok: true } | { ok: false; message: string };
