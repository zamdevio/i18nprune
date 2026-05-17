import * as path from 'node:path';
import * as vscode from 'vscode';
import { CONFIG_FILE_NAMES } from './configFiles';

export type DiscoveredProject = {
  /** Stable id — absolute path to config file. */
  id: string;
  configPath: string;
  /** Directory containing `i18nprune.config.*` (project root for paths in config). */
  projectRoot: string;
  /** Owning VS Code workspace folder fsPath. */
  workspaceFolderPath: string;
  /** Short label: relative path from workspace folder, or `.` */
  label: string;
};

function globPatternForConfigs(): string {
  const exts = [...new Set(CONFIG_FILE_NAMES.map((n) => path.extname(n).replace(/^\./, '')))];
  const brace = exts.length === 1 ? exts[0] : `{${exts.join(',')}}`;
  return `**/i18nprune.config.${brace}`;
}

/**
 * Discover every `i18nprune.config.*` under the workspace (nested apps/, packages/, etc.).
 * Respects `.gitignore` via findFiles; excludes `node_modules` explicitly.
 */
export async function discoverI18npruneProjects(): Promise<DiscoveredProject[]> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) return [];

  const seen = new Set<string>();
  const out: DiscoveredProject[] = [];

  for (const folder of folders) {
    const pattern = new vscode.RelativePattern(folder, globPatternForConfigs());
    const uris = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 500);

    for (const uri of uris) {
      const configPath = uri.fsPath;
      if (seen.has(configPath)) continue;
      seen.add(configPath);

      const projectRoot = path.dirname(configPath);
      const label = path.relative(folder.uri.fsPath, projectRoot);
      out.push({
        id: configPath,
        configPath,
        projectRoot,
        workspaceFolderPath: folder.uri.fsPath,
        label: label === '' ? '.' : label.replace(/\\/g, '/'),
      });
    }
  }

  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}
