import type { ParsedProjectUpload } from './upload.js';

/** Last successful prepared upload from a local workspace session (enables link-only Share). */
export type WorkspaceWorkerShareBinding = {
  workerBaseUrl: string;
  projectId: string;
  /** Trimmed configJson at share time (empty string = zip-only). */
  configFingerprint: string;
};

export type WorkspaceSession =
  | {
      mode: 'remote';
      workerBaseUrl: string;
      projectId: string;
      activeZipFile?: File;
      label?: string;
      uploadMeta?: { preparedAt?: string; extractionComputedAt?: string };
    }
  | {
      mode: 'local';
      local: ParsedProjectUpload;
      activeZipFile?: File;
      label?: string;
      /** Set after first Share upload; cleared when config override rebuilds the local snapshot. */
      workerShare?: WorkspaceWorkerShareBinding;
    };

export type WorkspaceConfigHintState = {
  kind: 'idle' | 'checking' | 'empty' | 'invalid' | 'valid';
  ok: boolean;
  message: string;
};
