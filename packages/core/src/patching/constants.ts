export const DEFAULT_PATCHING_RECIPE = 'loader_generated' as const;
export const DEFAULT_PATCHING_SIZE_LIMIT_BYTES = 512 * 1024;
export const DEFAULT_PATCHING_MODE = 'warn_skip' as const;
/** Boundaries for the machine-owned block inside `loaders.generated.ts` (`loader_generated`). */
export const GENERATED_MODULE_START = '// i18nprune:generated:start';
export const GENERATED_MODULE_END = '// i18nprune:generated:end';

/** Optional user-owned island inside `loaders.generated.ts` (preserved across regenerations). */
export const GENERATED_USER_START = '// i18nprune:user:start';
export const GENERATED_USER_END = '// i18nprune:user:end';

export const GENERATED_RECIPE_ID = 'loader_generated' as const;
