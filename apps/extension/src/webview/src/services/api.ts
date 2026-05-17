import {
  ProjectHealth,
  KeyObservation,
  ReviewLocaleStats,
  PruneResult,
  DoctorCheck,
  I18nConfig,
  type DashboardSnapshotV1,
} from '../types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const vscodeApi = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;

/** True inside a VS Code webview (extension dashboard). False in Vite/browser dev. */
export const isVsCodeWebview = Boolean(vscodeApi);

export function notifyExtensionWebviewReady(): void {
  vscodeApi?.postMessage({ command: 'webviewReady' });
}

/**
 * Opens the dashboard in an editor tab. When `snapshot` is set (panel → editor), the editor replaces its UI state.
 * From the panel webview, the extension may hide the bottom panel after this.
 */
export function requestOpenDashboardInEditor(fromPanel: boolean, snapshot?: DashboardSnapshotV1): void {
  vscodeApi?.postMessage({ command: 'openDashboardInEditor', fromPanel, snapshot });
}

/** Ask the extension to close this dashboard host (editor tab / panel) — e.g. after the last in-app tab is closed. */
export function requestCloseDashboardHost(): void {
  vscodeApi?.postMessage({ command: 'closeDashboardHost' });
}

export type DirectoryEntry = { name: string; type: 'file' | 'directory'; relPath: string };

const DIRECTORY_LIST_TIMEOUT_MS = 15_000;
let directoryRequestId = 0;

/** List files and folders under the workspace root (`relPath` is posix relative, e.g. `""` or `src/components`). */
export function listWorkspaceDirectory(relPath: string): Promise<DirectoryEntry[]> {
  if (!vscodeApi) {
    return Promise.reject(new Error('listWorkspaceDirectory is only available inside the VS Code webview'));
  }
  const requestId = ++directoryRequestId;
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('Directory listing timed out'));
    }, DIRECTORY_LIST_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
    };

    const onMessage = (event: MessageEvent) => {
      const msg = event.data as {
        command?: string;
        requestId?: number;
        entries?: DirectoryEntry[];
        error?: string;
      };
      if (msg?.command !== 'directoryListing' || msg.requestId !== requestId) return;
      cleanup();
      if (msg.error) {
        reject(new Error(msg.error));
        return;
      }
      resolve(msg.entries ?? []);
    };

    window.addEventListener('message', onMessage);
    vscodeApi.postMessage({ command: 'listDirectory', requestId, path: relPath });
  });
}

export type ReadFileResult =
  | { kind: 'text'; text: string; truncated?: boolean }
  | { kind: 'binary' }
  | { kind: 'error'; message: string };

const READ_FILE_TIMEOUT_MS = 30_000;
let readFileRequestId = 0;

/** Read workspace file as UTF-8 text for preview (extension caps size / rejects binary). */
export function readWorkspaceFile(relPath: string): Promise<ReadFileResult> {
  if (!vscodeApi) {
    return Promise.reject(new Error('readWorkspaceFile is only available inside the VS Code webview'));
  }
  const requestId = ++readFileRequestId;
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('Read file timed out'));
    }, READ_FILE_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
    };

    const onMessage = (event: MessageEvent) => {
      const msg = event.data as {
        command?: string;
        requestId?: number;
        text?: string;
        truncated?: boolean;
        binary?: boolean;
        error?: string;
      };
      if (msg?.command !== 'fileContents' || msg.requestId !== requestId) return;
      cleanup();
      if (msg.error) {
        resolve({ kind: 'error', message: msg.error });
        return;
      }
      if (msg.binary) {
        resolve({ kind: 'binary' });
        return;
      }
      if (typeof msg.text === 'string') {
        resolve({ kind: 'text', text: msg.text, truncated: msg.truncated });
        return;
      }
      resolve({ kind: 'error', message: 'Empty response from extension' });
    };

    window.addEventListener('message', onMessage);
    vscodeApi.postMessage({ command: 'readFile', requestId, path: relPath });
  });
}

const VALIDATION_TIMEOUT_MS = 25_000;

const MOCK_OBSERVATIONS: KeyObservation[] = [
  {
    kind: 'literal',
    resolvedKey: 'auth.login.title',
    span: { filePath: 'src/components/Login.tsx', line: 12, column: 8 }
  },
  {
    kind: 'template_resolved',
    resolvedKey: 'notifications.status.success',
    span: { filePath: 'src/utils/notify.ts', line: 45, column: 12 }
  },
  {
    kind: 'template_partial',
    templateRaw: 'errors.codes.${code}',
    unresolvedPlaceholders: ['code'],
    span: { filePath: 'src/api/client.ts', line: 102 }
  },
  {
    kind: 'literal',
    resolvedKey: 'settings.labels.appearance',
    span: { filePath: 'src/pages/Settings.tsx', line: 88 }
  },
  {
    kind: 'template_partial',
    templateRaw: 'marketing.campaigns.${id}.title',
    unresolvedPlaceholders: ['id'],
    span: { filePath: 'src/hooks/useMarketing.ts', line: 24 }
  }
];

const MOCK_STATS: ReviewLocaleStats[] = [
  {
    locale: 'es-ES',
    stringPaths: 420,
    englishIdentical: 12,
    legacyLeaves: 380,
    structuredLeaves: 40,
    needsReviewTrue: 5,
    missingTranslations: 8
  },
  {
    locale: 'fr-FR',
    stringPaths: 410,
    englishIdentical: 8,
    legacyLeaves: 300,
    structuredLeaves: 110,
    needsReviewTrue: 14,
    missingTranslations: 14
  },
  {
    locale: 'de-DE',
    stringPaths: 428,
    englishIdentical: 2,
    legacyLeaves: 425,
    structuredLeaves: 3,
    needsReviewTrue: 1,
    missingTranslations: 3
  }
];

type ValidateData = {
  missing: string[];
  count: number;
  dynamic: { count: number };
  keyObservations: { count: number };
};

type ValidateEnvelopeMessage = {
  command: 'validationResults';
  data?: { ok: boolean; kind: string; data: ValidateData; issues: { message: string; severity: string; code: string }[] };
  error?: string;
};

function mapValidateToProjectHealth(envelope: NonNullable<ValidateEnvelopeMessage['data']>): ProjectHealth {
  const { data } = envelope;
  return {
    totalSourceKeys: data.count,
    locales: [],
    observations: MOCK_OBSERVATIONS,
    stats: MOCK_STATS,
  };
}

export const fetchProjectHealth = async (): Promise<ProjectHealth> => {
  if (!vscodeApi) {
    await sleep(800);
    return {
      totalSourceKeys: 428,
      locales: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP'],
      observations: MOCK_OBSERVATIONS,
      stats: MOCK_STATS,
    };
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      fn();
    };

    const timer = window.setTimeout(() => {
      done(() => reject(new Error('Validation timed out — extension did not respond.')));
    }, VALIDATION_TIMEOUT_MS);

    const onMessage = (event: MessageEvent) => {
      const msg = event.data as ValidateEnvelopeMessage;
      if (msg?.command !== 'validationResults') return;
      if (msg.error) {
        done(() => reject(new Error(msg.error)));
        return;
      }
      if (!msg.data || msg.data.kind !== 'validate') {
        done(() => reject(new Error('Unexpected validation payload from extension')));
        return;
      }
      done(() => resolve(mapValidateToProjectHealth(msg.data)));
    };
    window.addEventListener('message', onMessage);
    vscodeApi.postMessage({ command: 'runValidation' });
  });
};

export const runMachineTranslation = async (locale: string): Promise<{ success: boolean; keysFilled: number }> => {
  await sleep(2500);
  const stat = MOCK_STATS.find(s => s.locale === locale);
  return {
    success: true,
    keysFilled: stat ? stat.missingTranslations : 0,
  };
};

export const quickFixIssue = async (issueId: string): Promise<boolean> => {
  await sleep(400);
  return true;
};

export const pruneKeys = async (ids: string[]): Promise<PruneResult> => {
  await sleep(1500);
  return {
    success: true,
    keysRemoved: ids.length,
  };
};

export const saveConfig = async (config: I18nConfig): Promise<boolean> => {
  await sleep(1000);
  return true;
};

export const runDoctor = async (): Promise<DoctorCheck[]> => {
  await sleep(1200);
  return [
    { id: 'node', label: 'Node.js Version', value: 'v20.11.0', status: 'pass' },
    { id: 'rg', label: 'ripgrep (rg) binary', value: '14.1.0', status: 'pass' },
    { id: 'config', label: 'Configuration File', value: 'Found i18nprune.config.ts', status: 'pass' },
    { id: 'files', label: 'FS Permissions', value: 'Write access granted', status: 'pass' },
    { id: 'api', label: 'Cloud Connectivity', value: 'Endpoints reachable', status: 'pass' },
  ];
};

export type GenerateUiPayload = {
  targets: string[];
  dryRun?: boolean;
  metadata?: boolean;
  resume?: boolean;
  force?: boolean;
  provider?: string;
  workers?: number;
  noLocaleMeta?: boolean;
  source?: string;
  configOverrides?: unknown;
};

let generateSeq = 0;

export function postSelectWorkspaceProject(projectId: string): void {
  vscodeApi?.postMessage({ command: 'setActiveProject', projectId });
}

/** Returns request id for correlating `generateProgress` / `generateFinished` messages. `-1` if not in webview. */
export function requestWorkspaceGenerate(payload: GenerateUiPayload): number {
  if (!vscodeApi) return -1;
  const requestId = ++generateSeq;
  vscodeApi.postMessage({ command: 'runGenerate', requestId, ...payload });
  return requestId;
}

export function cancelWorkspaceGenerate(requestId: number): void {
  vscodeApi?.postMessage({ command: 'cancelGenerate', requestId });
}

let configPreviewSeq = 0;

/** Loads resolved config + optional raw file for the active project (extension host). */
export function requestConfigPreview(): number {
  if (!vscodeApi) return -1;
  const requestId = ++configPreviewSeq;
  vscodeApi.postMessage({ command: 'requestConfigPreview', requestId });
  return requestId;
}

/** Switch dashboard tab from anywhere (Generate → Settings, etc.). */
export function navigateDashboardTab(tabId: string): void {
  window.dispatchEvent(new CustomEvent('i18nprune-navigate', { detail: { tabId } }));
}
