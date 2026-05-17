import path from 'node:path';
import * as vscode from 'vscode';
import type { DiscoveredProject } from './projectDiscovery';
import { discoverI18npruneProjects } from './projectDiscovery';
import { postToAllDashboards } from '../host/dashboardRegistry';

const STORAGE_KEY = 'i18nprune.activeProjectConfigPath';

export type ProjectBroadcast = {
  id: string;
  label: string;
  projectRoot: string;
  kind: 'config' | 'implicit';
};

let discoveryCache: DiscoveredProject[] = [];
let implicitFallbackRoot: string | undefined;
let activeConfigPath: string | null = null;

const activeProjectWorkspaceChanged = new vscode.EventEmitter<void>();

/** Fired after discovery refresh or when the user switches active config project — sidebar validation tree listens. */
export const onDidChangeActiveProjectWorkspace = activeProjectWorkspaceChanged.event;

function fireActiveProjectWorkspaceChanged(): void {
  activeProjectWorkspaceChanged.fire();
}

export function initWorkspaceProjects(context: vscode.ExtensionContext): void {
  context.subscriptions.push(new vscode.Disposable(() => activeProjectWorkspaceChanged.dispose()));

  const saved = context.workspaceState.get<string | undefined>(STORAGE_KEY);
  activeConfigPath = saved ?? null;

  void refreshWorkspaceProjects(context).then(() => postProjectsSnapshot(context));

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      void refreshWorkspaceProjects(context).then(() => postProjectsSnapshot(context));
    }),
  );
}

export async function refreshWorkspaceProjects(context: vscode.ExtensionContext): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  implicitFallbackRoot = folders?.[0]?.uri.fsPath;

  discoveryCache = await discoverI18npruneProjects();

  if (discoveryCache.length === 1) {
    activeConfigPath = discoveryCache[0]!.id;
    await context.workspaceState.update(STORAGE_KEY, activeConfigPath);
  } else if (discoveryCache.length === 0) {
    activeConfigPath = null;
    await context.workspaceState.update(STORAGE_KEY, undefined);
  } else {
    const savedStillValid =
      activeConfigPath !== null && discoveryCache.some((p) => p.id === activeConfigPath);
    if (!savedStillValid) {
      activeConfigPath = null;
      await context.workspaceState.update(STORAGE_KEY, undefined);
    }
  }

  fireActiveProjectWorkspaceChanged();
}

export async function setActiveProjectById(
  context: vscode.ExtensionContext,
  projectId: string | null,
): Promise<void> {
  if (projectId === null || projectId === 'implicit') {
    activeConfigPath = null;
    await context.workspaceState.update(STORAGE_KEY, undefined);
  } else {
    activeConfigPath = projectId;
    await context.workspaceState.update(STORAGE_KEY, projectId);
  }
  postProjectsSnapshot(context);
  fireActiveProjectWorkspaceChanged();
}

/** Effective project root for i18n config + core ops (generate, validate paths). */
export function getActiveProjectRoot(): string | undefined {
  if (activeConfigPath) {
    const hit = discoveryCache.find((p) => p.id === activeConfigPath);
    if (hit) return hit.projectRoot;
    // Discovery not finished yet — config id is the absolute config file path.
    return path.dirname(activeConfigPath);
  }
  return implicitFallbackRoot;
}

export function getActiveConfigPath(): string | null {
  return activeConfigPath;
}

export function listProjectsForUi(): ProjectBroadcast[] {
  const rows: ProjectBroadcast[] = discoveryCache.map((p) => ({
    id: p.id,
    label: p.label,
    projectRoot: p.projectRoot,
    kind: 'config' as const,
  }));

  const implicitNorm = implicitFallbackRoot ? path.normalize(implicitFallbackRoot) : '';
  const implicitRedundant = discoveryCache.some(
    (p) => path.normalize(p.projectRoot) === implicitNorm,
  );

  if (implicitFallbackRoot && !implicitRedundant) {
    rows.unshift({
      id: 'implicit',
      label: '(workspace default — no config file)',
      projectRoot: implicitFallbackRoot,
      kind: 'implicit',
    });
  }

  return rows;
}

/** Stable id for UI: config file path, or `implicit` for workspace-default loading. */
export function getActiveProjectBroadcastId(): string {
  if (activeConfigPath && discoveryCache.some((p) => p.id === activeConfigPath)) {
    return activeConfigPath;
  }
  return 'implicit';
}

export function postProjectsSnapshot(context: vscode.ExtensionContext): void {
  const projects = listProjectsForUi();

  postToAllDashboards({
    command: 'workspaceProjects',
    projects,
    activeProjectId: getActiveProjectBroadcastId(),
  });
}

/** Explorer listing root: workspace folder that contains the active project (multi-root safe). */
export function getExplorerRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) return undefined;
  const active = getActiveProjectRoot();
  if (active) {
    const wf = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(active));
    if (wf) return wf.uri.fsPath;
  }
  return folders[0]!.uri.fsPath;
}

export async function pickActiveProjectInteractive(context: vscode.ExtensionContext): Promise<void> {
  await refreshWorkspaceProjects(context);
  const items = listProjectsForUi();
  const picked = await vscode.window.showQuickPick(
    items.map((p) => ({
      label: p.label,
      description: p.projectRoot,
      id: p.id,
    })),
    { placeHolder: 'Select i18nprune project (config location)' },
  );
  if (!picked) return;
  await setActiveProjectById(context, picked.id === 'implicit' ? null : picked.id);
}
