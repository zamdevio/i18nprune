import path from 'node:path';
import { createJiti } from 'jiti';
import { ConfigValidationError, DEFAULT_CONFIG, parseI18nPruneConfig } from '@i18nprune/core/config';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import type { RuntimeAdapters } from '@i18nprune/core';
import { listDiscoveredConfigFiles } from './configFiles';
import { getJitiImportParentFilename } from '../bootstrap/extensionPaths';

export type LoadedWorkspaceConfig = {
  config: I18nPruneConfig;
  projectRoot: string;
};

export async function loadWorkspaceI18nConfig(
  workspaceRoot: string,
  adapters: RuntimeAdapters,
): Promise<LoadedWorkspaceConfig> {
  const found = listDiscoveredConfigFiles(workspaceRoot, adapters.fs);
  if (found.length === 0) {
    return { config: { ...DEFAULT_CONFIG } as I18nPruneConfig, projectRoot: workspaceRoot };
  }
  if (found.length > 1) {
    throw new ConfigValidationError(
      `Multiple config files (${found.map((p: string) => path.basename(p)).join(', ')}) in workspace root — keep a single i18nprune.config.*`,
    );
  }
  const configPath = found[0]!;
  const projectRoot = path.dirname(configPath);
  const ext = path.extname(configPath).toLowerCase();
  if (!['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs'].includes(ext)) {
    throw new ConfigValidationError(`Unsupported config file type ${ext}`);
  }
  const jiti = createJiti(getJitiImportParentFilename(), {
    interopDefault: true,
  });
  const mod = (await jiti.import(configPath)) as { default?: unknown };
  const raw = mod.default ?? mod;
  const merged = {
    ...DEFAULT_CONFIG,
    ...(typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}),
  };
  const parsed = parseI18nPruneConfig(merged);
  return { config: parsed as I18nPruneConfig, projectRoot };
}
