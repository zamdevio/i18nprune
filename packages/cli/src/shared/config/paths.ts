import path from 'node:path';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { existsRuntimeFsSync } from '@i18nprune/core/runtime/helpers/sync';
import { CONFIG_BASE_NAME } from '@/constants/cli.js';

/** Extensions accepted for `i18nprune.config.*` (TS/JS only — no `.json`). */
export const SUPPORTED_CONFIG_EXTENSIONS = new Set([
  '.ts',
  '.mts',
  '.cts',
  '.js',
  '.mjs',
  '.cjs',
]);

export const CONFIG_FILE_NAMES = [
  `${CONFIG_BASE_NAME}.ts`,
  `${CONFIG_BASE_NAME}.js`,
  `${CONFIG_BASE_NAME}.mts`,
  `${CONFIG_BASE_NAME}.mjs`,
  `${CONFIG_BASE_NAME}.cts`,
  `${CONFIG_BASE_NAME}.cjs`,
] as const;

let explicitConfigPath: string | undefined;
const nodeFs = createNodeRuntimeAdapters().fs;

export function getExplicitConfigPath(): string | undefined {
  return explicitConfigPath;
}

/**
 * After `ensureConfigPathResolved()` runs, this is always set (`null` = no file).
 * Before that, `undefined` means "not resolved yet" (see `resolveConfigFilePath`).
 */
let chosenImplicitPath: string | null | undefined;

export function setConfigPath(p: string | undefined): void {
  explicitConfigPath = p;
}

export function setChosenImplicitPath(p: string | null | undefined): void {
  chosenImplicitPath = p;
}

export function resetConfigPathResolution(): void {
  chosenImplicitPath = undefined;
}

export function listDiscoveredConfigFiles(cwd: string): string[] {
  const out: string[] = [];
  for (const name of CONFIG_FILE_NAMES) {
    const candidate = path.join(cwd, name);
    if (existsRuntimeFsSync(candidate, nodeFs)) out.push(candidate);
  }
  return out;
}

export class ConfigAmbiguityError extends Error {
  constructor(
    message: string,
    public readonly paths: string[],
  ) {
    super(message);
    this.name = 'ConfigAmbiguityError';
  }
}

export function configPathForContext(cwd = process.cwd()): string | null {
  return resolveConfigFilePath(cwd);
}

export function resolveConfigFilePath(cwd = process.cwd()): string | null {
  if (explicitConfigPath) {
    const abs = path.isAbsolute(explicitConfigPath)
      ? explicitConfigPath
      : path.resolve(cwd, explicitConfigPath);
    return existsRuntimeFsSync(abs, nodeFs) ? abs : null;
  }

  if (chosenImplicitPath !== undefined) {
    return chosenImplicitPath;
  }

  const found = listDiscoveredConfigFiles(cwd);
  if (found.length === 0) return null;
  if (found.length === 1) return found[0]!;
  throw new ConfigAmbiguityError(
    `Multiple config files (${found.map((p) => path.basename(p)).join(', ')}) — call ensureConfigPathResolved() first or pass --config`,
    found,
  );
}
