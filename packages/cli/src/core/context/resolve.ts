import { loadConfig, configExists } from '@/config/load/index.js';
import {
  configPathForContext,
  resolveConfigFilePath,
  resetConfigPathResolution,
} from '@/config/resolve/scan.js';
import { getRunOptions } from '@/core/runtime/options.js';
import type { I18nPruneConfig } from '@/types/config/index.js';
import type {
  CliGlobalOverrides,
  ConfigLayer,
  Context,
  ContextMeta,
  FieldSources,
} from '@/types/core/context/index.js';
import { applyEnvToConfig, loadEnvOverrides } from '@/core/context/env.js';
import { runDiscovery } from '@/core/context/discover.js';
import { getCliGlobalOverrides } from '@/core/context/globals.js';
import { resolveFromCwd } from '@/utils/paths/index.js';

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
  return out;
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

let cache: Context | null = null;

/**
 * Resolves the full project context by merging:
 * - defaults → config file → environment variables → discovery → CLI overrides
 *
 * This is the **single source of truth** used by the CLI and all programmatic usage.
 *
 * @param cwd - Working directory (defaults to `process.cwd()`)
 * @returns Fully resolved `Context` with `config`, `paths`, `run`, and `meta`
 * @see {@link https://github.com/zamdevio/i18nprune/blob/main/docs/exports/core.md | Core API Guide}
 */
export function resolveContext(cwd = process.cwd()): Context {
  if (cache) return cache;

  const fileLoaded = configExists();
  const base = loadConfig();
  const sources = initFieldSources(fileLoaded);

  const env = loadEnvOverrides();
  let merged = applyEnvToConfig(base, env);
  overlay(sources, base, merged, 'env');

  const cli = getCliGlobalOverrides();
  const noDiscovery = Boolean(env.noDiscovery || cli.noDiscovery);

  const discoveryWarnings: string[] = [];
  if (!noDiscovery) {
    const { patch, warnings } = runDiscovery(merged);
    discoveryWarnings.push(...warnings);
    const before = merged;
    merged = { ...merged, ...patch };
    if (JSON.stringify(before) !== JSON.stringify(merged)) {
      overlay(sources, before, merged, 'discovery');
    }
  }

  const beforeCli = merged;
  merged = applyCliToConfig(merged, cli);
  overlay(sources, beforeCli, merged, 'cli');

  const run = getRunOptions();
  const paths = {
    sourceLocale: resolveFromCwd(merged.source, cwd),
    localesDir: resolveFromCwd(merged.localesDir, cwd),
    srcRoot: resolveFromCwd(merged.src, cwd),
  };

  cache = {
    config: merged,
    paths,
    run,
    meta: {
      fieldSources: sources,
      warnings: discoveryWarnings,
    },
  };
  return cache;
}

/**
 * Clears the internal context cache.
 * Useful in long-running processes, tests, or when switching projects.
 */
export function clearContextCache(): void {
  cache = null;
  resetConfigPathResolution();
}

export { configPathForContext, resolveConfigFilePath };
