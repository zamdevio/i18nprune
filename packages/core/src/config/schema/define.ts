import { DEFAULT_CONFIG } from '../defaults/app.js';
import { validateLocalesSourceConfigValue } from '../locales/sourceValidate.js';
import { ConfigValidationError } from './root.js';
import { clampTranslateMaxWorkers } from './translate.js';
import type { I18nPruneConfig } from './root.js';

/**
 * Typed helper for **`i18nprune.config.{ts,mts,cts,js,mjs,cjs}`** files. Merges partial user input
 * with **`DEFAULT_CONFIG`** and normalizes a few fields (notably **`translate.workers`** clamping)
 * so the returned value matches what the CLI / SDK see at runtime.
 *
 * Returns the public friendly **`I18nPruneConfig`** directly — drop it straight into
 * **`createCoreContext`**:
 *
 * @example
 * ```ts
 * // i18nprune.config.ts
 * import { defineConfig } from '@i18nprune/core';
 *
 * export default defineConfig({
 *   locales: {
 *     source: 'en',
 *     directory: 'locales',
 *   },
 *   src: 'src',
 *   functions: ['t'],
 *   translate: {
 *     primary: 'google',
 *     providers: [{ id: 'google' }],
 *   },
 * });
 * ```
 *
 * @remarks
 * - **`.json`** configs are intentionally not loaded by the CLI - see
 *   **`SUPPORTED_CONFIG_EXTENSIONS`** in **`packages/cli/src/shared/config/paths.ts`**.
 * - For runtime-validated input from REST / DB / generated sources, use
 *   **`parseI18nPruneConfig`** instead - it runs the same zod schema and surfaces field errors via
 *   **`ConfigValidationError`**.
 * - Call this once per project; the file is loaded by the CLI host (or by an SDK consumer with
 *   **`loadCoreConfigFromPath`**).
 */
export function defineConfig(config: Partial<I18nPruneConfig>): I18nPruneConfig {
  const refDef = DEFAULT_CONFIG.reference?.defaults;
  const refCmd = DEFAULT_CONFIG.reference?.commands;
  const merged = {
    ...DEFAULT_CONFIG,
    ...config,
    functions: config.functions?.length ? config.functions : DEFAULT_CONFIG.functions,
    policies: { ...DEFAULT_CONFIG.policies, ...config.policies },
    reference: {
      ...DEFAULT_CONFIG.reference,
      ...config.reference,
      defaults: { ...refDef, ...config.reference?.defaults },
      commands: { ...refCmd, ...config.reference?.commands },
    },
    missing: { ...DEFAULT_CONFIG.missing, ...config.missing },
    locales: (() => {
      const mergedLocales = { ...DEFAULT_CONFIG.locales, ...config.locales };
      const sourceCheck = validateLocalesSourceConfigValue(mergedLocales.source);
      if (!sourceCheck.ok) {
        throw new ConfigValidationError(sourceCheck.message, undefined, sourceCheck.issueCode);
      }
      return { ...mergedLocales, source: sourceCheck.code };
    })(),
    translate:
      config.translate !== undefined
        ? {
            ...DEFAULT_CONFIG.translate,
            ...config.translate,
            workers:
              config.translate.workers === undefined
                ? 1
                : typeof config.translate.workers === 'number'
                  ? clampTranslateMaxWorkers(config.translate.workers)
                  : (config.translate.workers as unknown as number),
          }
        : DEFAULT_CONFIG.translate,
  };
  // Same runtime shape as `I18nPruneConfigParsed`; cast surfaces the friendly authoring view.
  return merged as I18nPruneConfig;
}
