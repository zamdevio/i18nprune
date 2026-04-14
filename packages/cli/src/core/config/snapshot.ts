import { configPathForContext } from '@/config/resolve/scan.js';
import { CLI_VERSION } from '@/constants/cli.js';
import { getI18nPruneEnvSnapshot } from '@/core/context/globals.js';
import { getRunOptions } from '@/core/runtime/options.js';
import { resolvedPathKinds } from '@/commands/config/kinds.js';
import type { Context } from '@/types/core/context/index.js';
import type { ConfigSnapshot } from '@/types/commands/config/index.js';

export function buildConfigSnapshot(ctx: Context): ConfigSnapshot {
  return {
    kind: 'i18nprune.config',
    cliVersion: CLI_VERSION,
    configPath: configPathForContext(),
    config: ctx.config,
    resolvedPaths: ctx.paths,
    fieldSources: ctx.meta.fieldSources,
    resolvedPathKinds: resolvedPathKinds(ctx.paths),
    env: getI18nPruneEnvSnapshot(),
    run: { ...getRunOptions() },
  };
}
