/// <reference path="./injected.d.ts" />
import rootPkg from '../../../../package.json' with { type: 'json' };

/** CLI semver: injected in `dist/cli.js` at build; falls back to root `package.json` in source/dev. */
export function resolveCliVersion(): string {
  if (typeof __I18NPRUNE_CLI_VERSION__ === 'string') {
    return __I18NPRUNE_CLI_VERSION__;
  }
  return rootPkg.version;
}
