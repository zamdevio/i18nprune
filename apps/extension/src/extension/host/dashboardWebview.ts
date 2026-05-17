import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { PREVIEW_BINARY_EXT_RE, shouldListExplorerEntry } from '../workspace/exploreIgnore';
import { registerDashboardWebview } from './dashboardRegistry';
import { getLanguageCatalogCompact } from '../bootstrap/languageCatalog';
import { runValidateForProjectRoot } from '../ops/runValidateWorkspace';
import { runGenerateForActiveProject } from '../ops/runGenerateWorkspace';
import { getActiveProjectConfigPreview } from '../ops/configPreview';
import {
  getActiveProjectRoot,
  getActiveProjectBroadcastId,
  getExplorerRoot,
  listProjectsForUi,
  refreshWorkspaceProjects,
  setActiveProjectById,
} from '../workspace/workspaceProjects';
import { buildTranslationProvidersPayload } from '../bootstrap/translationProvidersMeta';

const PREVIEW_MAX_BYTES = 512 * 1024;

export type DashboardEmbedSurface = 'editor' | 'panel';

export type DashboardWebviewHooks = {
  /** When the webview asks to close its host (e.g. last tab closed with Ctrl+W). */
  onRequestCloseHost?: () => void;
};

let dashboardEditorOpener: ((opts: { fromPanel: boolean; snapshot?: unknown }) => void) | undefined;

/** Wired from `extension.ts` so this module stays free of circular imports with `webview.ts`. */
export function setDashboardEditorOpener(
  fn: (opts: { fromPanel: boolean; snapshot?: unknown }) => void,
): void {
  dashboardEditorOpener = fn;
}

/** Resolve `rel` under explorer root; return null if traversal escapes root. */
function safeResolveUnderRoot(root: string, rel: string): string | null {
  const absRoot = path.resolve(root);
  const joined = path.resolve(absRoot, rel);
  const prefix = absRoot.endsWith(path.sep) ? absRoot : absRoot + path.sep;
  if (joined !== absRoot && !joined.startsWith(prefix)) {
    return null;
  }
  return joined;
}

function rewriteAssetUris(html: string, distRoot: vscode.Uri, webview: vscode.Webview): string {
  return html.replace(
    /(src|href)="(\.\/)?assets\/([^"]+)"/g,
    (_full, attr: string, _dot: string | undefined, file: string) => {
      const uri = webview.asWebviewUri(vscode.Uri.joinPath(distRoot, 'assets', file));
      return `${attr}="${uri}"`;
    },
  );
}

/** Must match Vite `outDir` in `src/webview/vite.config.ts` (currently `dist/webview`). */
const distFolder = 'dist/webview';

type WebviewMessage = {
  command?: string;
  fromPanel?: boolean;
  snapshot?: unknown;
  requestId?: number;
  path?: string;
  projectId?: string;
  targets?: string[];
  dryRun?: boolean;
  metadata?: boolean;
  resume?: boolean;
  force?: boolean;
  provider?: string;
  workers?: number;
  source?: string;
  configOverrides?: unknown;
  /** See {@link requestConfigPreview} from webview Settings. */
};

const generateCancellation = new Map<number, vscode.CancellationTokenSource>();

/**
 * Shared dashboard HTML + IPC (validation, workspace snapshots) for any {@link vscode.Webview}.
 */
export function attachDashboardWebview(
  webview: vscode.Webview,
  context: vscode.ExtensionContext,
  embedSurface: DashboardEmbedSurface,
  hooks?: DashboardWebviewHooks,
  /** Applied once after `webviewReady` + `workspaceSnapshot` (new editor tab only). */
  restoreSnapshot?: unknown,
): vscode.Disposable {
  let snapshotToRestore: unknown | undefined = restoreSnapshot;
  const distRoot = vscode.Uri.joinPath(context.extensionUri, distFolder);
  const indexFsPath = path.join(distRoot.fsPath, 'index.html');

  webview.options = {
    enableScripts: true,
    localResourceRoots: [distRoot],
  };

  const reg = registerDashboardWebview(webview);

  const postWorkspaceSnapshot = (): void => {
    const explorerRoot = getExplorerRoot();
    void webview.postMessage({
      command: 'workspaceSnapshot',
      hasFolder: Boolean(explorerRoot),
      embedSurface,
      projects: listProjectsForUi(),
      activeProjectId: getActiveProjectBroadcastId(),
      languageCatalog: getLanguageCatalogCompact(),
      translationProviders: buildTranslationProvidersPayload(),
    });
  };

  try {
    let html = fs.readFileSync(indexFsPath, 'utf8');
    html = rewriteAssetUris(html, distRoot, webview);
    webview.html = html;
  } catch {
    webview.html = `<!DOCTYPE html><html><body>
      <p>Webview bundle missing. Run <code>pnpm run build:webview</code> (outputs <code>dist/webview</code>), then reload.</p>
    </body></html>`;
  }

  const workspaceSub = vscode.workspace.onDidChangeWorkspaceFolders(() => {
    void refreshWorkspaceProjects(context).then(() => postWorkspaceSnapshot());
  });

  const msgSub = webview.onDidReceiveMessage(async (raw: WebviewMessage) => {
    if (raw.command === 'webviewReady') {
      await refreshWorkspaceProjects(context);
      postWorkspaceSnapshot();
      const snap = snapshotToRestore;
      snapshotToRestore = undefined;
      if (snap !== undefined) {
        queueMicrotask(() => {
          void webview.postMessage({ command: 'dashboardStateRestore', state: snap });
        });
      }
      return;
    }

    if (raw.command === 'openDashboardInEditor') {
      dashboardEditorOpener?.({ fromPanel: raw.fromPanel === true, snapshot: raw.snapshot });
      return;
    }

    if (raw.command === 'closeDashboardHost') {
      hooks?.onRequestCloseHost?.();
      return;
    }

    if (raw.command === 'setActiveProject') {
      const pid = typeof raw.projectId === 'string' ? raw.projectId : '';
      await setActiveProjectById(context, pid === 'implicit' ? null : pid || null);
      postWorkspaceSnapshot();
      return;
    }

    if (raw.command === 'requestConfigPreview') {
      const requestId = raw.requestId;
      if (requestId === undefined) return;
      const root = getActiveProjectRoot();
      if (!root) {
        void webview.postMessage({
          command: 'configPreview',
          requestId,
          error: 'No workspace folder open.',
        });
        return;
      }
      try {
        const preview = await getActiveProjectConfigPreview(root);
        void webview.postMessage({
          command: 'configPreview',
          requestId,
          ...preview,
        });
      } catch (err) {
        void webview.postMessage({
          command: 'configPreview',
          requestId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      return;
    }

    if (raw.command === 'listDirectory') {
      const requestId = raw.requestId;
      const rel = typeof raw.path === 'string' ? raw.path.replace(/\\/g, '/') : '';
      const root = getExplorerRoot();
      if (requestId === undefined) return;

      if (!root) {
        void webview.postMessage({
          command: 'directoryListing',
          requestId,
          error: 'No workspace folder open.',
        });
        return;
      }

      const abs = safeResolveUnderRoot(root, rel);
      if (abs === null) {
        void webview.postMessage({
          command: 'directoryListing',
          requestId,
          error: 'Invalid path.',
        });
        return;
      }

      try {
        const dirents = fs.readdirSync(abs, { withFileTypes: true });
        const entries = dirents
          .filter((d) => shouldListExplorerEntry(d.name, d.isDirectory()))
          .map((d) => {
            const name = d.name;
            const childRel = rel ? `${rel}/${name}` : name;
            return {
              name,
              type: d.isDirectory() ? ('directory' as const) : ('file' as const),
              relPath: childRel.replace(/\\/g, '/'),
            };
          })
          .sort((a, b) => {
            if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
        void webview.postMessage({ command: 'directoryListing', requestId, entries });
      } catch (err) {
        void webview.postMessage({
          command: 'directoryListing',
          requestId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      return;
    }

    if (raw.command === 'readFile') {
      const requestId = raw.requestId;
      const rel = typeof raw.path === 'string' ? raw.path.replace(/\\/g, '/') : '';
      const root = getExplorerRoot();
      if (requestId === undefined) return;

      if (!root) {
        void webview.postMessage({
          command: 'fileContents',
          requestId,
          error: 'No workspace folder open.',
        });
        return;
      }

      const abs = safeResolveUnderRoot(root, rel);
      if (abs === null) {
        void webview.postMessage({
          command: 'fileContents',
          requestId,
          error: 'Invalid path.',
        });
        return;
      }

      try {
        const st = fs.statSync(abs);
        if (!st.isFile()) {
          void webview.postMessage({
            command: 'fileContents',
            requestId,
            error: 'Not a file.',
          });
          return;
        }

        const base = path.basename(abs);
        if (PREVIEW_BINARY_EXT_RE.test(base)) {
          void webview.postMessage({ command: 'fileContents', requestId, binary: true });
          return;
        }

        let buf = fs.readFileSync(abs);
        const truncated = buf.length > PREVIEW_MAX_BYTES;
        if (truncated) {
          buf = buf.subarray(0, PREVIEW_MAX_BYTES);
        }

        const sample = buf.subarray(0, Math.min(buf.length, 16_384));
        if (sample.includes(0)) {
          void webview.postMessage({ command: 'fileContents', requestId, binary: true });
          return;
        }

        const text = buf.toString('utf8');
        void webview.postMessage({
          command: 'fileContents',
          requestId,
          text,
          truncated,
        });
      } catch (err) {
        void webview.postMessage({
          command: 'fileContents',
          requestId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      return;
    }

    if (raw.command === 'runGenerate') {
      const requestId = raw.requestId;
      if (requestId === undefined || !Array.isArray(raw.targets) || raw.targets.length === 0) {
        void webview.postMessage({
          command: 'generateFinished',
          requestId: requestId ?? -1,
          ok: false,
          error: 'Invalid generate request (need targets[] and requestId).',
        });
        return;
      }

      const root = getActiveProjectRoot();
      if (!root) {
        void webview.postMessage({
          command: 'generateFinished',
          requestId,
          ok: false,
          error: 'No workspace folder open.',
        });
        return;
      }

      generateCancellation.get(requestId)?.dispose();
      const cts = new vscode.CancellationTokenSource();
      generateCancellation.set(requestId, cts);

      void runGenerateForActiveProject(
        root,
        requestId,
        {
          targets: raw.targets,
          dryRun: raw.dryRun,
          metadata: raw.metadata,
          resume: raw.resume,
          force: raw.force,
          provider: raw.provider,
          workers: raw.workers,
          source: raw.source,
          configOverrides: raw.configOverrides,
        },
        cts.token,
      ).finally(() => {
        generateCancellation.delete(requestId);
        cts.dispose();
      });
      return;
    }

    if (raw.command === 'cancelGenerate') {
      const requestId = raw.requestId;
      if (requestId !== undefined) {
        generateCancellation.get(requestId)?.cancel();
      }
      return;
    }

    if (raw.command !== 'runValidation') return;

    const projectRoot = getActiveProjectRoot();
    if (!projectRoot) {
      void webview.postMessage({
        command: 'validationResults',
        error: 'No workspace folder open.',
      });
      return;
    }

    const envelope = await runValidateForProjectRoot(projectRoot);
    void webview.postMessage({
      command: 'validationResults',
      data: envelope,
    });
  });

  return vscode.Disposable.from(workspaceSub, msgSub, reg);
}

/** Bottom panel webview only (activity bar uses native tree views). */
export class I18nprunePanelDashboardViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    const d = attachDashboardWebview(webviewView.webview, this.context, 'panel', {
      onRequestCloseHost: () => {
        void vscode.commands.executeCommand('workbench.action.closePanel');
      },
    });
    webviewView.onDidDispose(() => d.dispose());
  }
}
