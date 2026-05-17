import * as vscode from 'vscode';
import { runValidateForProjectRoot } from '../ops/runValidateWorkspace';
import { getActiveProjectRoot } from '../workspace/workspaceProjects';

type ValidateData = {
  count: number;
  missing: string[];
  dynamic: { count: number };
  keyObservations: { count: number };
};

type CliJsonEnvelope = {
  ok: boolean;
  kind: string;
  data?: ValidateData;
  issues?: { message: string; severity: string; code: string }[];
};

const MAX_ISSUE_ROWS = 8;

export class WorkspaceProjectTreeProvider implements vscode.TreeDataProvider<ProjectTreeItem> {
  private readonly _onDidChange = new vscode.EventEmitter<ProjectTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  private cache: CliJsonEnvelope | null | undefined = undefined;
  private loading = false;

  refresh(): void {
    this.cache = undefined;
    this.loading = false;
    void this.prefetch();
  }

  private getValidateRoot(): string | undefined {
    return getActiveProjectRoot() ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  private async prefetch(): Promise<void> {
    const root = this.getValidateRoot();
    if (!root) {
      this.cache = null;
      this.loading = false;
      this._onDidChange.fire();
      return;
    }
    this.loading = true;
    this._onDidChange.fire();
    try {
      const env = (await runValidateForProjectRoot(root)) as CliJsonEnvelope;
      this.cache = env;
    } catch {
      this.cache = {
        ok: false,
        kind: 'validate',
        issues: [{ message: 'Validation failed unexpectedly.', severity: 'error', code: 'extension' }],
      };
    } finally {
      this.loading = false;
      this._onDidChange.fire();
    }
  }

  getTreeItem(element: ProjectTreeItem): vscode.TreeItem {
    return element;
  }

  getParent(): undefined {
    return undefined;
  }

  getChildren(element?: ProjectTreeItem): vscode.ProviderResult<ProjectTreeItem[]> {
    if (element) {
      return [];
    }

    const root = this.getValidateRoot();
    const wf = root ? vscode.workspace.getWorkspaceFolder(vscode.Uri.file(root)) : undefined;
    const folderName = wf?.name ?? vscode.workspace.workspaceFolders?.[0]?.name;

    if (!root) {
      const open = new ProjectTreeItem('open-folder', 'Open a folder…', vscode.TreeItemCollapsibleState.None, 'folder-opened');
      open.command = { command: 'workbench.action.files.openFolder', title: 'Open Folder' };
      const hint = new ProjectTreeItem(
        'hint',
        'Then refresh this view',
        vscode.TreeItemCollapsibleState.None,
        'info',
        { description: 'Workspace required' },
      );
      return [open, hint];
    }

    const header = new ProjectTreeItem('workspace', folderName ?? 'Workspace', vscode.TreeItemCollapsibleState.None, 'repo', {
      description: root,
    });

    if (this.loading || this.cache === undefined) {
      void this.prefetch();
      const busy = new ProjectTreeItem(
        'loading',
        'Running validate…',
        vscode.TreeItemCollapsibleState.None,
        'sync~spin',
      );
      return [header, busy];
    }

    if (this.cache === null) {
      return [header];
    }

    const data = this.cache.data;
    const issues = this.cache.issues ?? [];
    const ok = this.cache.ok;

    const status = new ProjectTreeItem(
      'status',
      ok ? 'Validate: clean' : 'Validate: issues',
      vscode.TreeItemCollapsibleState.None,
      ok ? 'check' : 'warning',
      { description: ok ? 'no missing keys' : `${issues.length} issue(s)` },
    );

    const rows: ProjectTreeItem[] = [
      header,
      status,
      metric('keys', 'Resolved source keys', data?.count ?? 0),
      metric('missing', 'Missing translations', data?.missing.length ?? 0),
      metric('dynamic', 'Dynamic key sites', data?.dynamic.count ?? 0),
      metric('obs', 'Key observations', data?.keyObservations.count ?? 0),
    ];

    if (issues.length > 0) {
      rows.push(
        new ProjectTreeItem('issues-hdr', '— Issues —', vscode.TreeItemCollapsibleState.None, 'warning', {
          description: `showing ${Math.min(issues.length, MAX_ISSUE_ROWS)} of ${issues.length}`,
        }),
      );
      issues.slice(0, MAX_ISSUE_ROWS).forEach((iss, i) => {
        rows.push(
          new ProjectTreeItem(
            `issue:${i}`,
            iss.message,
            vscode.TreeItemCollapsibleState.None,
            iss.severity === 'error' ? 'error' : 'warning',
            { description: iss.code },
          ),
        );
      });
    }

    return rows;
  }
}

function metric(id: string, label: string, value: number): ProjectTreeItem {
  return new ProjectTreeItem(id, label, vscode.TreeItemCollapsibleState.None, 'symbol-numeric', {
    description: String(value),
  });
}

type ItemOpts = { description?: string };

export class ProjectTreeItem extends vscode.TreeItem {
  constructor(
    public readonly id: string,
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    iconId: string,
    opts?: ItemOpts,
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon(iconId);
    this.contextValue = 'i18nprune.projectRow';
    if (opts?.description !== undefined) {
      this.description = opts.description;
    }
  }
}
