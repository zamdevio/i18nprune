import * as vscode from 'vscode';
import { I18nprunePanelDashboardViewProvider, setDashboardEditorOpener } from './host/dashboardWebview';
import { registerNativeSidebar } from './sidebar/registerNativeSidebar';
import {
  openI18npruneDashboardEditor,
  revealI18nprunePanel,
  revealI18npruneSidebar,
} from './host/webview';
import { setExtensionInstallRoot } from './bootstrap/extensionPaths';
import { initWorkspaceProjects, pickActiveProjectInteractive } from './workspace/workspaceProjects';
import { registerWorkspaceFilesystemWatchers } from './workspace/workspaceFilesystemWatchers';

export function activate(context: vscode.ExtensionContext): void {
  setExtensionInstallRoot(context.extensionPath);
  initWorkspaceProjects(context);
  registerWorkspaceFilesystemWatchers(context);

  setDashboardEditorOpener(({ fromPanel, snapshot }) => {
    openI18npruneDashboardEditor(context, snapshot);
    void vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
    // No public API to close a single contributed Panel view; optionally hide the whole bottom panel.
    if (fromPanel) {
      void vscode.commands.executeCommand('workbench.action.closePanel');
    }
  });

  registerNativeSidebar(context);

  const panelProvider = new I18nprunePanelDashboardViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('i18nprune.panelDashboard', panelProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('i18nprune.openDashboard', () => {
      openI18npruneDashboardEditor(context);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('i18nprune.showSideBar', async () => {
      await revealI18npruneSidebar();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('i18nprune.openDashboardPanel', async () => {
      await revealI18nprunePanel();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('i18nprune.selectProject', async () => {
      await pickActiveProjectInteractive(context);
    }),
  );
}

export function deactivate(): void {}
