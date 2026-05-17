import path from 'node:path';
import process from 'node:process';
import {
  createCoreContext,
  createIdentityStreakGuard as createIdentityGuard,
  extractor,
  IdentityAbortError,
  runGenerate,
  type GenerateHostHooks,
  type GenerateRunHooks,
  type GenerateRunOptions,
  type RunOptions,
} from '@i18nprune/core';
import type { CoreEngineRuntime } from '@i18nprune/core';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import type * as vscode from 'vscode';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { postToAllDashboards } from '../host/dashboardRegistry';
import { mergeConfigOverrides } from './mergeConfigOverrides';
import { loadWorkspaceI18nConfig } from '../workspace/loadWorkspaceConfig';

function resolveFromRoot(p: string, root: string): string {
  return path.isAbsolute(p) ? p : path.resolve(root, p);
}

function normalizeErr(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export type ExtensionGenerateUiOptions = {
  targets: string[];
  dryRun?: boolean;
  metadata?: boolean;
  resume?: boolean;
  force?: boolean;
  provider?: string;
  workers?: number;
  /** Relative override for source locale path (CLI `--source`). */
  source?: string;
  /** Deep partial overrides merged into parsed config before `createCoreContext`. */
  configOverrides?: unknown;
};

/**
 * Runs core `runGenerate` for the active project; streams **`generateProgress`** to all dashboards.
 */
export async function runGenerateForActiveProject(
  projectRoot: string,
  requestId: number,
  ui: ExtensionGenerateUiOptions,
  token: vscode.CancellationToken,
): Promise<void> {
  const adapters = createNodeRuntimeAdapters();
  const { fs, path: pathPort, system } = adapters;

  if (token.isCancellationRequested) return;

  let loaded: Awaited<ReturnType<typeof loadWorkspaceI18nConfig>>;
  try {
    loaded = await loadWorkspaceI18nConfig(projectRoot, adapters);
  } catch (err) {
    postToAllDashboards({
      command: 'generateFinished',
      requestId,
      ok: false,
      error: normalizeErr(err),
    });
    return;
  }

  let mergedConfig: I18nPruneConfig;
  try {
    mergedConfig = mergeConfigOverrides(loaded.config, ui.configOverrides);
  } catch (err) {
    postToAllDashboards({
      command: 'generateFinished',
      requestId,
      ok: false,
      error: `Config override validation failed: ${normalizeErr(err)}`,
    });
    return;
  }

  const { projectRoot: cfgRoot } = loaded;
  const paths = {
    sourceLocale: resolveFromRoot(mergedConfig.locales.source, cfgRoot),
    localesDir: resolveFromRoot(mergedConfig.locales.directory, cfgRoot),
    srcRoot: resolveFromRoot(mergedConfig.src, cfgRoot),
  };

  const runtime: CoreEngineRuntime = { fs, path: pathPort, system };
  const scanInput = {
    srcRoot: paths.srcRoot,
    functions: mergedConfig.functions,
    runtime,
    exclude: mergedConfig.exclude,
  };

  const dynamicSites = extractor.dynamic.scanProjectDynamicKeySites(scanInput);

  const runFlags: RunOptions = {
    json: true,
    jsonPretty: false,
    quiet: false,
    silent: false,
    debugScan: false,
    debugCache: false,
  };

  const generateOpts: GenerateRunOptions = {
    targets: ui.targets,
    dynamicKeySites: dynamicSites.length,
    source: ui.source,
    provider: ui.provider,
    workers: ui.workers,
    force: ui.force,
    dryRun: ui.dryRun,
    metadata: ui.metadata,
    resume: ui.resume,
  };

  const emit = (e: Record<string, unknown>): void => {
    if (token.isCancellationRequested) return;
    postToAllDashboards({
      command: 'generateProgress',
      requestId,
      event: e,
    });
  };

  const host: GenerateHostHooks = {
    emitProgress: (ev) => {
      emit({ ...ev });
    },

    createSession: () => ({
      progress: {
        tick: (current: number, total: number, label: string) => {
          emit({
            type: 'run.progress.generate',
            phase: 'translate_tick',
            current,
            total,
            label,
          });
        },
      },
      finish: () => {},
      fail: () => {},
    }),

    createIdentityStreakGuard: (target, _clock) =>
      createIdentityGuard({
        command: 'generate',
        target,
        interactive: () => false,
      }),

    buildTickProgressRelay: ({ tick, target, translationMeta }) => {
      return (i, t, lbl, opts) => {
        tick(i, t, lbl, opts);
        emit({
          type: 'run.progress.generate',
          phase: 'translate',
          target,
          current: i,
          total: t,
          label: lbl,
          providerId: translationMeta.providerId,
          translationModel: translationMeta.translationModel,
        });
      };
    },

    shouldSkipInteractivePrompts: () => true,
    canAskInteractive: () => false,

    promptFullRetranslate: async () => false,

    printPreserveParityReport: () => {},
    printFinalizeSummary: () => {},

    onIdentityAbortNotice: (err: IdentityAbortError, opts) => {
      emit({
        type: 'generate.identity_abort',
        message: err.message,
        dryRun: opts.dryRun,
      });
    },
  };

  const hooks: GenerateRunHooks = {
    onIncomplete: async () => ({ action: 'abort_no_write' }),
    onHandoffPick: async () => null,
  };

  const ctx = createCoreContext({
    config: mergedConfig,
    adapters,
    env: process.env,
    paths,
    run: runFlags,
  });

  if (token.isCancellationRequested) return;

  try {
    const result = await runGenerate(ctx, generateOpts, host, hooks);
    postToAllDashboards({
      command: 'generateFinished',
      requestId,
      ok: true,
      result: {
        payload: result.payload,
        issues: result.issues,
      },
    });
  } catch (err) {
    postToAllDashboards({
      command: 'generateFinished',
      requestId,
      ok: false,
      error: normalizeErr(err),
    });
  }
}
