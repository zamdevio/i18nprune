import * as vscode from 'vscode';
import { postToAllDashboards } from '../host/dashboardRegistry';
import { postProjectsSnapshot, refreshWorkspaceProjects } from './workspaceProjects';

/** Coalesce rapid saves — explorer + open file previews refresh. */
const EXPLORER_STALE_DEBOUNCE_MS = 450;

/** Config discovery / multi-project list — heavier; avoid rescanning on every keystroke. */
const PROJECT_RESCAN_DEBOUNCE_MS = 2000;

let explorerTimer: ReturnType<typeof setTimeout> | undefined;
let projectTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleExplorerStaleBroadcast(): void {
  if (explorerTimer !== undefined) clearTimeout(explorerTimer);
  explorerTimer = setTimeout(() => {
    explorerTimer = undefined;
    postToAllDashboards({ command: 'workspaceFilesystemStale' });
  }, EXPLORER_STALE_DEBOUNCE_MS);
}

function scheduleProjectRescan(context: vscode.ExtensionContext): void {
  if (projectTimer !== undefined) clearTimeout(projectTimer);
  projectTimer = setTimeout(() => {
    projectTimer = undefined;
    void refreshWorkspaceProjects(context).then(() => postProjectsSnapshot(context));
  }, PROJECT_RESCAN_DEBOUNCE_MS);
}

/**
 * Watches workspace folders so the dashboard file tree and previews can stay in sync with disk.
 * Uses debounced events (not fixed-interval polling): cheap under burst edits, still responsive.
 */
export function registerWorkspaceFilesystemWatchers(context: vscode.ExtensionContext): void {
  let folderWatchers: vscode.FileSystemWatcher[] = [];

  const disposeWatchers = (): void => {
    for (const w of folderWatchers) {
      w.dispose();
    }
    folderWatchers = [];
  };

  const attachWatchers = (): void => {
    disposeWatchers();
    for (const wf of vscode.workspace.workspaceFolders ?? []) {
      const w = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(wf, '**'));
      const bump = (): void => {
        scheduleExplorerStaleBroadcast();
        scheduleProjectRescan(context);
      };
      w.onDidChange(bump);
      w.onDidCreate(bump);
      w.onDidDelete(bump);
      folderWatchers.push(w);
    }
  };

  attachWatchers();

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      attachWatchers();
    }),
    new vscode.Disposable(() => {
      disposeWatchers();
      if (explorerTimer !== undefined) clearTimeout(explorerTimer);
      if (projectTimer !== undefined) clearTimeout(projectTimer);
    }),
  );
}
