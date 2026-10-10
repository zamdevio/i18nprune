import path from 'node:path';
import { createJiti } from 'jiti';
import { DEFAULT_CONFIG, parseI18nPruneConfig, ConfigValidationError } from '@i18nprune/core/config';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import { resolveConfigFilePath, SUPPORTED_CONFIG_EXTENSIONS } from './paths.js';

export function configExists() {
  const p = resolveConfigFilePath();
  return p !== null;
}

/**
 * Load the config at an explicit path (or built-in defaults when `null`).
 *
 * Root-parameterized on purpose: a long-lived host (e.g. `serve` in hub mode) resolves a different
 * config per project root, so it must not read the process-global chosen path. The CLI's
 * {@link loadConfig} passes the globally-resolved path and keeps its existing behavior.
 */
export async function loadConfigFromPath(resolved: string | null): Promise<I18nPruneConfig> {
  if (!resolved) {
    return { ...DEFAULT_CONFIG } as I18nPruneConfig;
  }
  const ext = path.extname(resolved).toLowerCase();
  if (!SUPPORTED_CONFIG_EXTENSIONS.has(ext)) {
    throw new ConfigValidationError(
      `Unsupported config file type ${ext} — use .ts, .mts, .cts, .js, .mjs, or .cjs (JSON configs are not supported).`,
    );
  }
  const jiti = createJiti(import.meta.url, { interopDefault: true });
  const mod = (await jiti.import(resolved)) as { default?: unknown };
  const raw = mod.default ?? mod;
  const merged = {
    ...DEFAULT_CONFIG,
    ...(typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}),
  };
  return parseI18nPruneConfig(merged);
}

export async function loadConfig(): Promise<I18nPruneConfig> {
  return loadConfigFromPath(resolveConfigFilePath());
}
