/// <reference path="./injected.d.ts" />
import corePkg from '../../../package.json' with { type: 'json' };

/** SDK semver: injected in `packages/core/dist` at build; falls back to `package.json` in source/dev. */
export function resolveSdkVersion(): string {
  if (typeof __I18NPRUNE_SDK_VERSION__ === 'string') {
    return __I18NPRUNE_SDK_VERSION__;
  }
  return corePkg.version;
}
