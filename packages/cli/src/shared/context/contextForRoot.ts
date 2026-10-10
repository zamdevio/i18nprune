import path from 'node:path';
import {
  getRunOptions,
  loadProjectFilesState,
  mergeTrackedFileMaps,
  omitSyntheticSourceKey,
  resolveSourceLocaleAbsolutePath,
} from '@i18nprune/core';
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
import { resolveFromCwd } from '@/utils/paths/index.js';
import { initializeCliCacheState } from '@/shared/cache/index.js';
import { buildCliCacheRuntime } from '@/shared/cache/runtime.js';
import {
  buildCliPatchSuppressedWarning,
  normalizeConfigRuntimeFields,
  shouldSuppressPatchEnableFromCli,
} from '@/shared/config/runtime.js';
import { loadConfigFromPath } from '@/shared/config/load.js';
import { resolveConfigFilePath } from '@/shared/config/paths.js';
import { getCliGlobalOverrides } from './globals.js';

function parseFunctionsCsv(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function applyCliToConfig(base: I18nPruneConfig, cli: CliGlobalOverrides): I18nPruneConfig {
  const out = { ...base };
  if (cli.source !== undefined || cli.localesDir !== undefined) {
    out.locales = {
      ...base.locales,
      ...(cli.source !== undefined ? { source: cli.source } : {}),
      ...(cli.localesDir !== undefined ? { directory: cli.localesDir } : {}),
    };
  }
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
  if (cli.cacheProfile !== undefined) {
    out.cache = { ...(out.cache ?? {}), profile: cli.cacheProfile };
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
  if (JSON.stringify(prev.locales) !== JSON.stringify(next.locales)) sources.locales = layer;
  if (prev.src !== next.src) sources.src = layer;
  if (JSON.stringify(prev.functions) !== JSON.stringify(next.functions)) sources.functions = layer;
  if (JSON.stringify(prev.policies) !== JSON.stringify(next.policies)) sources.policies = layer;
}

function initFieldSources(fileLoaded: boolean): FieldSources {
  const layer: ConfigLayer = fileLoaded ? 'file' : 'default';
  return {
    locales: layer,
    src: layer,
    functions: layer,
    ...(layer === 'file' ? { policies: 'file' as const } : {}),
  };
}

/** Root-scoped inputs a caller owns; never the process-global config path or cwd. */
export type RootResolveInput = {
  /** Absolute project root (the directory the config lives in). */
  readonly projectRoot: string;
  /** Absolute config file path, or `null` when the project has no config (defaults apply). */
  readonly configPath: string | null;
  /** Per-run CLI overrides already merged by the host (serve: empty). */
  readonly cliOverrides: CliGlobalOverrides;
  /** `RunOptions` this context reports to its consumers. */
  readonly run: Context['run'];
  /**
   * cwd reported in envelopes (`meta.cwd`) and the `RuntimeAdapters.system.cwd()` override. Serve
   * sets this to the request root; the single-root CLI leaves it undefined (process cwd).
   */
  readonly cwd?: string;
};

/**
 * Resolve a full {@link Context} for **one** project root, from explicitly-owned inputs.
 *
 * This is the root-parameterized core of the CLI's context resolution — a long-lived host resolves a
 * different root per request without touching process globals. The CLI's {@link resolveContext}
 * wraps it with the process-global config path, cwd, and CLI overrides.
 */
export async function resolveContextForRoot(input: RootResolveInput): Promise<Context> {
  const base = createNodeRuntimeAdapters();
  const cwd = input.cwd;
  const adapters =
    cwd === undefined ? base : { ...base, system: { ...base.system, cwd: () => cwd } };

  const projectRoot = input.projectRoot;
  const fileLoaded = input.configPath !== null;
  const loaded = await loadConfigFromPath(input.configPath);
  const sources = initFieldSources(fileLoaded);

  const env = loadEnvOverrides();
  let merged = applyEnvToConfig(loaded, env);
  overlay(sources, loaded, merged, 'env');

  const cli = input.cliOverrides;
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

  const run = input.run;
  const localesDir = resolveFromCwd(merged.locales.directory, projectRoot);
  const paths = {
    sourceLocale: resolveSourceLocaleAbsolutePath({
      locales: merged.locales,
      directoryAbsolute: localesDir,
      path: adapters.path,
      fs: adapters.fs,
    }),
    localesDir,
    srcRoot: resolveFromCwd(merged.src, projectRoot),
  };

  const configCacheDisabled = merged.cache?.enabled === false;
  const cacheRootDir = merged.cache?.dir ? resolveFromCwd(merged.cache.dir, projectRoot) : undefined;
  const disabledReason =
    cli.noCache === true ? 'cli_no_cache' : configCacheDisabled ? 'config_disabled' : undefined;
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
    ? (() => {
        const snapshot = loadProjectFilesState(cacheInit.state, buildCliCacheRuntime(adapters)).files;
        return mergeTrackedFileMaps(omitSyntheticSourceKey(snapshot.files), snapshot.localeSegments ?? {});
      })()
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
}

/** Serve-host inputs: process env + the host's own RunOptions and (empty) CLI overrides. */
export type RootContextHost = {
  readonly run: Context['run'];
  readonly cliOverrides: CliGlobalOverrides;
};

/**
 * Resolve a context for `projectRoot` alone by discovering its config, independent of any global
 * chosen path. Used by `serve` in both root modes.
 */
export async function resolveContextForProjectRoot(
  projectRoot: string,
  host: RootContextHost,
): Promise<Context> {
  return resolveContextForRoot({
    projectRoot,
    configPath: resolveConfigFilePath(projectRoot),
    cliOverrides: host.cliOverrides,
    run: host.run,
    cwd: projectRoot,
  });
}

/**
 * CLI entry (unchanged contract): resolve using process cwd, the globally-chosen config path, and
 * process-global CLI overrides.
 */
export async function resolveContext(cwd = process.cwd()): Promise<Context> {
  const configPath = resolveConfigFilePath(cwd);
  const projectRoot = configPath ? path.dirname(configPath) : cwd;
  return resolveContextForRoot({
    projectRoot,
    configPath,
    cliOverrides: getCliGlobalOverrides(),
    run: getRunOptions(),
  });
}
