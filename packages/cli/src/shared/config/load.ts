import path from 'node:path';
import { createJiti } from 'jiti';
import { DEFAULT_CONFIG, parseI18nPruneConfig, ConfigValidationError } from '@i18nprune/core/config';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import { resolveConfigFilePath, SUPPORTED_CONFIG_EXTENSIONS } from './paths.js';

export function configExists() {
  const p = resolveConfigFilePath();
  return p !== null;
}

export async function loadConfig(): Promise<I18nPruneConfig> {
  const resolved = resolveConfigFilePath();
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

export { ConfigValidationError };
