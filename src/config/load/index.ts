/**
 * Load `i18nprune.config` from disk. Internally everything is normalized to **`I18nPruneConfig`**
 * (defaults merged + Zod parse) — same shape no matter which extension you use.
 *
 * - **Primary in docs:** \`${CONFIG_BASE_NAME}.config.ts\` + \`defineConfig()\` from \`@zamdevio/i18nprune/config\`
 * - **Fallback:** \`${CONFIG_BASE_NAME}.config.js\` / \`.mjs\` (ESM-friendly)
 * - **Also supported:** \`.mts\`, \`.cts\`, \`.cjs\` (see \`CONFIG_FILE_NAMES\` in \`resolve/scan.ts\`)
 *
 * Loader: **jiti** (handles TS and interop `default` / CJS).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createJiti } from 'jiti';
import { DEFAULT_CONFIG } from '@/config/defaults.js';
import { parseI18nPruneConfig, ConfigValidationError } from '@/config/schema.js';
import type { I18nPruneConfig } from '@/types/config/index.js';
import { resolveConfigFilePath } from '@/config/resolve/scan.js';
import { CONFIG_BASE_NAME } from '@/constants/cli.js';

export function configExists(): boolean {
  const p = resolveConfigFilePath();
  return p !== null && fs.existsSync(p);
}

export function loadConfig(): I18nPruneConfig {
  const resolved = resolveConfigFilePath();
  if (!resolved) {
    return { ...DEFAULT_CONFIG };
  }
  const ext = path.extname(resolved).toLowerCase();
  const supported = new Set(['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs']);
  if (!supported.has(ext)) {
    throw new ConfigValidationError(
      `Unsupported config file type ${ext} — use .ts, .mts, .cts, .js, .mjs, or .cjs (JSON configs are not supported).`,
    );
  }
  const jiti = createJiti(import.meta.url, { interopDefault: true });
  const mod = jiti(resolved) as { default?: unknown };
  const raw = mod.default ?? mod;
  const merged = {
    ...DEFAULT_CONFIG,
    ...(typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}),
  };
  const parsed = parseI18nPruneConfig(merged);
  return parsed as I18nPruneConfig;
}

export { ConfigValidationError };
