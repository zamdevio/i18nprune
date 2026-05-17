import * as vscode from 'vscode';
import { onDidChangeActiveProjectWorkspace } from '../workspace/workspaceProjects';
import { QuickActionsTreeProvider } from './quickActionsTree';
import { WorkspaceProjectTreeProvider } from './workspaceProjectTree';

/** Activity-bar i18nprune container: native tree views (no webview). */
export function registerNativeSidebar(context: vscode.ExtensionContext): void {
  const quick = new QuickActionsTreeProvider();
  const project = new WorkspaceProjectTreeProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('i18nprune.sidebarQuickActions', quick),
    vscode.window.registerTreeDataProvider('i18nprune.sidebarWorkspace', project),
    vscode.commands.registerCommand('i18nprune.refreshProjectStatus', () => {
      project.refresh();
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      project.refresh();
    }),
    onDidChangeActiveProjectWorkspace(() => {
      project.refresh();
    }),
  );

}
