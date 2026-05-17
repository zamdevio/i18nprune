import * as vscode from 'vscode';

type ActionDef = { id: string; label: string; description?: string; command: string; icon: string };

const ACTIONS: ActionDef[] = [
  {
    id: 'open-editor',
    label: 'Open dashboard in editor',
    description: 'Full workspace UI in an editor tab',
    command: 'i18nprune.openDashboard',
    icon: 'window',
  },
  {
    id: 'open-panel',
    label: 'Open dashboard in panel',
    description: 'Docked below the editor',
    command: 'i18nprune.openDashboardPanel',
    icon: 'layout-panel-bottom',
  },
];

export class QuickActionsTreeProvider implements vscode.TreeDataProvider<ActionTreeItem> {
  getTreeItem(element: ActionTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): ActionTreeItem[] {
    return ACTIONS.map((a) => new ActionTreeItem(a));
  }

  getParent(): null {
    return null;
  }
}

export class ActionTreeItem extends vscode.TreeItem {
  constructor(def: ActionDef) {
    super(def.label, vscode.TreeItemCollapsibleState.None);
    this.description = def.description;
    this.iconPath = new vscode.ThemeIcon(def.icon);
    this.command = { command: def.command, title: def.label };
    this.contextValue = 'i18nprune.quickAction';
  }
}
