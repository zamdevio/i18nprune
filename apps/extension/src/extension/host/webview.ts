import * as vscode from 'vscode';
import { attachDashboardWebview } from './dashboardWebview';

/** At most one editor-tab dashboard; additional opens reveal this instance. */
let editorDashboardPanel: vscode.WebviewPanel | undefined;

export function openI18npruneDashboardEditor(
  context: vscode.ExtensionContext,
  restoreSnapshot?: unknown,
): void {
  if (editorDashboardPanel) {
    editorDashboardPanel.reveal(vscode.ViewColumn.Active);
    if (restoreSnapshot !== undefined) {
      void editorDashboardPanel.webview.postMessage({
        command: 'dashboardStateRestore',
        state: restoreSnapshot,
      });
    }
    return;
  }

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    void vscode.window.showInformationMessage(
      'Open a folder in VS Code to run i18nprune on a project. The dashboard will update automatically when you do.',
    );
  }

  const panel = vscode.window.createWebviewPanel(
    'i18npruneDashboard',
    'i18nprune',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview')],
    },
  );

  editorDashboardPanel = panel;

  const disposable = attachDashboardWebview(
    panel.webview,
    context,
    'editor',
    {
      onRequestCloseHost: () => panel.dispose(),
    },
    restoreSnapshot,
  );

  panel.onDidDispose(() => {
    editorDashboardPanel = undefined;
    disposable.dispose();
  });
}

/** Focus the activity bar i18nprune container (native Actions + Project trees). */
export async function revealI18npruneSidebar(): Promise<void> {
  await vscode.commands.executeCommand('workbench.view.extension.i18nprune');
  await vscode.commands.executeCommand('i18nprune.sidebarQuickActions.focus');
}

/** Focus the Panel (bottom) i18nprune dashboard webview. */
export async function revealI18nprunePanel(): Promise<void> {
  await vscode.commands.executeCommand('i18nprune.panelDashboard.focus');
}
