import type { LocalProjectSession } from '../lib/services/core/buildLocalProject';

export type WorkspaceSession =
  | {
    mode: 'remote';
    workerBaseUrl: string;
    projectId: string;
    activeZipFile?: File;
    label?: string;
    uploadMeta?: { uploadedAt?: string; extractionComputedAt?: string };
  }
  | { mode: 'local'; local: LocalProjectSession; activeZipFile?: File; label?: string };


export type WorkspaceConfigHintState = {
  kind: 'idle' | 'checking' | 'empty' | 'invalid' | 'valid';
  ok: boolean;
  message: string;
};
