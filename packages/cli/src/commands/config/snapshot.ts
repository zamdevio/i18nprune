import { configPathForContext } from '@/shared/config/index.js';
import { CLI_VERSION } from '@/constants/cli.js';
import { getI18nPruneEnvSnapshot } from '@/shared/context/globals.js';
import { getRunOptions } from '@i18nprune/core';
import { resolvedPathKinds } from '@/commands/config/kinds.js';
import type { Context } from '@/types/core/context/index.js';
import type { ConfigSnapshot } from '@/types/commands/config/index.js';

export function buildConfigSnapshot(ctx: Context): ConfigSnapshot {
  return {
    kind: 'i18nprune.config',
    cliVersion: CLI_VERSION,
    configPath: configPathForContext(),
    configFileLoaded: ctx.meta.configFileLoaded,
    config: ctx.config,
    resolvedPaths: ctx.paths,
    fieldSources: ctx.meta.fieldSources,
    resolvedPathKinds: resolvedPathKinds(ctx.paths, ctx.adapters.fs),
    env: getI18nPruneEnvSnapshot(),
    run: { ...getRunOptions() },
  };
}
