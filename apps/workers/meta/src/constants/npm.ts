/**
 * Published npm names (registry.npmjs.org). Keep in sync with packages when you ship.
 *
 * VS Code / Cursor extensions are normally published to the **Visual Studio Marketplace**
 * (and optionally **Open VSX**), not npm. Until an extension is published to npm under this
 * name, the worker will return version `null` and a registry error — same shape as CLI/core.
 *
 * Override with worker vars if you publish under different names:
 * - NPM_CLI_PACKAGE (default i18nprune)
 * - NPM_CORE_PACKAGE (default @i18nprune/core)
 * - NPM_EXTENSION_PACKAGE (default @i18nprune/extension) — set to a real npm name if you mirror version there
 */
export const NPM_CLI_DEFAULT = "i18nprune";
export const NPM_CORE_DEFAULT = "@i18nprune/core";
export const NPM_EXTENSION_DEFAULT = "@i18nprune/extension";

export const NPM_REGISTRY_ORIGIN = "https://registry.npmjs.org";
