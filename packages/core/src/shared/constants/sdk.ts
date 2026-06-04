import { resolveSdkVersion } from './version.js';

/** npm package name for the i18nprune SDK (`packages/core`). */
export const SDK_PACKAGE_NAME = '@i18nprune/core' as const;

/** Semantic version from `packages/core/package.json` (injected at core build; see `version.ts`). */
export const SDK_VERSION = resolveSdkVersion();
