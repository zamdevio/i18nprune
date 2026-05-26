import type {
  MetadataScalar,
  PayloadProcessorInfo,
  ProjectExtractionSummaryMeta,
  ProjectMetadataTiming,
} from './metadata.js';

export type WorkerErrorAction = 'reduce_payload' | 'fix_payload' | 'retry' | 'reupload' | 'self_host';

export type WorkerErrorHttpStatus = 400 | 404 | 413 | 429 | 503 | 507;

export type WorkerApiErrorItem = {
  code: string;
  message: string;
  details?: Record<string, string | number | boolean | null>;
  suggestions?: string[];
  recoverable?: boolean;
  action?: WorkerErrorAction;
  retryAfterSeconds?: number;
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
  fileCount: number;
  textFileCount: number;
  detectedConfigPath: string | null;
  extractionReady: boolean;
  expiresAt: MetadataScalar;
  timing: ProjectMetadataTiming;
  processor: PayloadProcessorInfo;
  extraction: ProjectExtractionSummaryMeta | null;
};

export type ProjectUploadResponse = {
  projectId: string;
  snapshotMeta: ProjectUploadSnapshotMeta;
};

export type WorkerHealthResult = { ok: true } | { ok: false; message: string };
