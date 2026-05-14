import { loadConfig, configExists } from '@/shared/config/load.js';
import { configPathForContext, resolveConfigFilePath, resetConfigPathResolution } from '@/shared/config/paths.js';
import { getRunOptions, loadProjectFilesState } from '@i18nprune/core';
import type { ScanExcludeConfig } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import type {
  CliGlobalOverrides,
  ConfigLayer,
  Context,
  FieldSources,
} from '@/types/core/context/index.js';
import { applyEnvToConfig, loadEnvOverrides } from './env.js';
import { runDiscovery } from './discover.js';
import { getCliGlobalOverrides } from './globals.js';
import { resolveFromCwd } from '@/utils/paths/index.js';
import { initializeCliCacheState } from '@/shared/cache/index.js';
import { buildCliCacheRuntime } from '@/shared/cache/runtime.js';
import {
  buildCliPatchSuppressedWarning,
  normalizeConfigRuntimeFields,
  shouldSuppressPatchEnableFromCli,
} from '@/shared/config/runtime.js';
import path from 'node:path';

function parseFunctionsCsv(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function applyCliToConfig(base: I18nPruneConfig, cli: CliGlobalOverrides): I18nPruneConfig {
  const out = { ...base };
  if (cli.source !== undefined) out.source = cli.source;
  if (cli.localesDir !== undefined) out.localesDir = cli.localesDir;
  if (cli.src !== undefined) out.src = cli.src;
  if (cli.functions !== undefined && cli.functions.length > 0) {
    out.functions = parseFunctionsCsv(cli.functions);
  }
  if (cli.patch === true) {
    if (shouldSuppressPatchEnableFromCli(out)) {
      /* keep patching.enabled as-is; warning attached in resolveContext */
    } else {
      out.patching = { ...(out.patching ?? {}), enabled: true };
    }
  }
  return mergeScanExcludeCli(out, cli);
}

function mergeScanExcludeCli(base: I18nPruneConfig, cli: CliGlobalOverrides): I18nPruneConfig {
  const extra = cli.scanExcludeDirNames;
  const noDefault = cli.noDefaultScanSkip === true;
  if ((!extra || extra.length === 0) && !noDefault) return base;

  const prev = base.exclude;
  const exclude: ScanExcludeConfig = { ...(prev ?? {}) };
  if (extra && extra.length > 0) {
    const merged = [...(prev?.dirs ?? []), ...extra];
    const seen = new Set<string>();
    exclude.dirs = merged.filter((rule) => {
      if (typeof rule !== 'string') return true;
      if (seen.has(rule)) return false;
      seen.add(rule);
      return true;
    });
  }
  if (noDefault) {
    exclude.useDefaultSkip = false;
  }
  return { ...base, exclude };
}

function overlay(
  sources: FieldSources,
  prev: I18nPruneConfig,
  next: I18nPruneConfig,
  layer: Exclude<ConfigLayer, 'default' | 'file'>,
): void {
  if (prev.source !== next.source) sources.source = layer;
  if (prev.localesDir !== next.localesDir) sources.localesDir = layer;
  if (prev.src !== next.src) sources.src = layer;
  if (JSON.stringify(prev.functions) !== JSON.stringify(next.functions)) sources.functions = layer;
  if (JSON.stringify(prev.policies) !== JSON.stringify(next.policies)) sources.policies = layer;
}

function initFieldSources(fileLoaded: boolean): FieldSources {
  const layer: ConfigLayer = fileLoaded ? 'file' : 'default';
  return {
    source: layer,
    localesDir: layer,
    src: layer,
    functions: layer,
    ...(layer === 'file' ? { policies: 'file' as const } : {}),
  };
}

let cache: Promise<Context> | null = null;

export async function resolveContext(cwd = process.cwd()): Promise<Context> {
  if (cache) return cache;
  cache = (async () => {
    const adapters = createNodeRuntimeAdapters();

    const configPath = configPathForContext(cwd);
    const projectRoot = configPath ? path.dirname(configPath) : cwd;
    const fileLoaded = configExists();
    const base = await loadConfig();
    const sources = initFieldSources(fileLoaded);

    const env = loadEnvOverrides();
    let merged = applyEnvToConfig(base, env);
    overlay(sources, base, merged, 'env');

    const cli = getCliGlobalOverrides();
    const noDiscovery = Boolean(env.noDiscovery || cli.noDiscovery);

    const discoveryWarnings: string[] = [];
    if (!noDiscovery) {
      const { patch, warnings } = runDiscovery(merged, projectRoot, adapters.fs);
      discoveryWarnings.push(...warnings);
      const before = merged;
      merged = { ...merged, ...patch };
      if (JSON.stringify(before) !== JSON.stringify(merged)) {
        overlay(sources, before, merged, 'discovery');
      }
    }

    const beforeCli = merged;
    merged = applyCliToConfig(merged, cli);
    if (cli.patch === true && shouldSuppressPatchEnableFromCli(merged)) {
      discoveryWarnings.push(buildCliPatchSuppressedWarning(merged));
    }
    merged = normalizeConfigRuntimeFields(merged, discoveryWarnings);
    overlay(sources, beforeCli, merged, 'cli');

    const run = getRunOptions();
    const paths = {
      sourceLocale: resolveFromCwd(merged.source, projectRoot),
      localesDir: resolveFromCwd(merged.localesDir, projectRoot),
      srcRoot: resolveFromCwd(merged.src, projectRoot),
    };

    const configCacheDisabled = merged.cache?.enabled === false;
    const cacheRootDir = merged.cache?.dir ? resolveFromCwd(merged.cache.dir, projectRoot) : undefined;
    const disabledReason = cli.noCache === true ? 'cli_no_cache' : configCacheDisabled ? 'config_disabled' : undefined;
    const cacheInit = initializeCliCacheState({
      projectRoot,
      noCache: cli.noCache === true || configCacheDisabled,
      ...(disabledReason !== undefined ? { disabledReason } : {}),
      ...(cacheRootDir !== undefined ? { cacheRootDir } : {}),
      cacheReadOnly: merged.cache?.mode === 'readOnly',
      adapters,
    });
    for (const warn of cacheInit.warnings) {
      discoveryWarnings.push(`cache: ${warn.message}`);
    }

    const cacheBaselineFiles = cacheInit.state.enabled
      ? loadProjectFilesState(cacheInit.state, buildCliCacheRuntime(adapters)).files.files
      : undefined;

    return {
      config: merged,
      paths,
      run,
      meta: {
        fieldSources: sources,
        configFileLoaded: fileLoaded,
        warnings: discoveryWarnings,
        cache: cacheInit.state,
        cacheBaselineFiles,
      },
      adapters,
    };
  })();
  return cache;
}

export function clearContextCache(): void {
  cache = null;
  resetConfigPathResolution();
}

export { configPathForContext, resolveConfigFilePath };
