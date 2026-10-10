import path from 'node:path';
import { getRunOptions } from '@i18nprune/core';
import type { Context } from '@/types/core/context/index.js';
import { getCliGlobalOverrides } from './globals.js';
import { resolveConfigFilePath, resetConfigPathResolution } from '@/shared/config/paths.js';
import { resolveContextForRoot } from './contextForRoot.js';

/**
 * Single-entry context for one CLI invocation. Cached per process because the CLI runs exactly one
 * command; a multi-root host (`serve` hub mode) must use {@link resolveContextForProjectRoot} /
 * {@link resolveContextForRoot} instead of this singleton.
 */
let cache: Promise<Context> | null = null;

export async function resolveContext(cwd = process.cwd()): Promise<Context> {
  if (cache) return cache;
  cache = (async () => {
    const configPath = resolveConfigFilePath(cwd);
    const projectRoot = configPath ? path.dirname(configPath) : cwd;
    return resolveContextForRoot({
      projectRoot,
      configPath,
      cliOverrides: getCliGlobalOverrides(),
      run: getRunOptions(),
    });
  })();
  return cache;
}

export function clearContextCache(): void {
  cache = null;
  resetConfigPathResolution();
}
