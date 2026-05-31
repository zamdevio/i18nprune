import type { CoreContext, HostedIngestProcessorContext, I18nPruneConfig } from '@i18nprune/core';
import { SDK_VERSION, createLocaleReadCache } from '@i18nprune/core';
import { createWebRuntimeAdapters } from '@i18nprune/core/runtime/web';
import type { RuntimeFsPort } from '@i18nprune/core';

const WEB_TOOL_VERSION = 'runtime-web/0.1.0';

const stubFs: RuntimeFsPort = {
  exists: () => false,
  readText: () => '',
  statKind: () => 'missing',
  listDir: () => [],
  writeText: () => undefined,
  deleteFile: () => undefined,
  mkdirp: () => undefined,
};

/** Minimal {@link CoreContext} for share manifest hashing in the browser (no disk config). */
export function createWebShareCoreContext(): CoreContext {
  const adapters = createWebRuntimeAdapters({ cwd: '/project', fs: stubFs });
  return {
    config: {} as I18nPruneConfig,
    adapters,
    env: {},
    paths: {
      sourceLocale: '/project/locales/en.json',
      localesDir: '/project/locales',
      srcRoot: '/project/src',
    },
    configFileLoaded: false,
    localeRead: createLocaleReadCache(),
  };
}

export function webProcessorContext(route: 'prepared' | 'archive'): HostedIngestProcessorContext {
  return {
    surface: 'web',
    route,
    sdk: 'i18nprune-web',
    sdkVersion: SDK_VERSION,
    toolVersion: WEB_TOOL_VERSION,
  };
}
