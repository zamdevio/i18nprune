import { resolveContext, clearContextCache } from '@/shared/context/index.js';
import { resolveConfigFilePath } from '@/shared/config/index.js';
import { confirm } from '@inquirer/prompts';
import {
  buildPatchingSectionIncompleteDiagnostic,
  patchingBlockPresent,
  existsRuntimeFsSync,
  getRunOptions,
} from '@i18nprune/core';
import { buildCliJsonEnvelope, stringifyEnvelope } from '@i18nprune/core';
import {
  issuesFromDiscoveryWarnings,
  issuesFromPatchingDiagnostics,
  mergeIssues,
} from '@/shared/result/index.js';
import { logger } from '@/utils/logger/index.js';
import {
  buildScaffoldFileContents,
  patchingLocaleJsonImportBaseForProjectConfig,
  resolvePatchScaffoldPaths,
} from '@/shared/patching/scaffoldI18nLayout.js';
import { analyzePatchingStateFromContext, runPatchingFromContext } from '@/shared/patching/fromContext.js';
import { repairPatchingConfigLocales } from '@/shared/patching/configLocales.js';
import {
  buildPatchingSnippet,
  ensurePatchingConfigBlock,
  formatPatchingSnippetForManualCopy,
  tryInjectPatchingConfig,
  tryReplacePatchingConfig,
} from '@/shared/patching/injectConfigBlock.js';
import type { EnsurePatchingConfigBlockResult } from '@/types/shared/patching/injectConfigBlock.js';
import { PATCH_RENEW_CLI_FILES } from '@/shared/patching/guidance.js';
import { canAsk } from '@/shared/ask/index.js';
import { duringPrompt } from '@/utils/timer/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import type { PatchCommandOptions } from '@/types/command/patch/index.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { printCommandSummary } from '@/output/index.js';

function warnForceWithoutInit(): void {
  const run = getRunOptions();
  logger.warn('`--force` only applies with `patch --init`; ignoring `--force`.', run);
}

function logManualPatchingConfigSnippet(prefix: string, inject: EnsurePatchingConfigBlockResult, run: ReturnType<typeof getRunOptions>): void {
  if (inject.configUpdated || inject.status === 'skipped_existing') return;
  const reason = inject.skipReason ?? inject.status.replace(/^skipped_/, '').replace(/_/g, ' ');
  logger.warn(`${prefix}: skipped automatic patching config injection (${reason}).`, run);
  logger.tip('Add this patching block to i18nprune.config.* manually:', run);
  for (const line of formatPatchingSnippetForManualCopy(inject.suggestedSnippet).split('\n')) {
    logger.detail(line, run);
  }
}

function logManualPatchingSnippetFromText(prefix: string, reason: string, snippet: string, run: ReturnType<typeof getRunOptions>): void {
  logger.warn(`${prefix}: skipped automatic patching config injection (${reason}).`, run);
  logger.tip('Add this patching block to i18nprune.config.* manually:', run);
  for (const line of formatPatchingSnippetForManualCopy(snippet).split('\n')) {
    logger.detail(line, run);
  }
}

export async function patch(opts: PatchCommandOptions): Promise<void> {
  const run = getRunOptions();
  let ctx = await resolveContext();

  const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'patch' });
  if (readiness) {
    const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), readiness);
    if (run.json) {
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('patch', { kind: 'patch' }, { ok: false, issues, cwd: ctx.adapters.system.cwd() }),
        ),
      );
      process.exitCode = 1;
      return;
    }
    printCommandSummary({ command: 'patch', ok: false, issues }, ctx);
    process.exitCode = 1;
    return;
  }

  if (opts.force && !opts.init) {
    warnForceWithoutInit();
  }
  const scaffold = resolvePatchScaffoldPaths(ctx);
  const missingScaffoldParts = [
    !existsRuntimeFsSync(scaffold.configPath, ctx.adapters.fs) ? 'config.json' : null,
    !existsRuntimeFsSync(scaffold.loaderPath, ctx.adapters.fs) ? 'loaders.generated.ts' : null,
  ].filter((x): x is string => Boolean(x));

  if (opts.init) {
    const paths = scaffold;
    ctx.adapters.fs.mkdirp(paths.i18nDir);

    const hasConfig = existsRuntimeFsSync(paths.configPath, ctx.adapters.fs);
    const hasGeneratedModule = existsRuntimeFsSync(paths.loaderPath, ctx.adapters.fs);

    if (opts.force) {
      const { configText, generatedText, localeJsonImportBase } = buildScaffoldFileContents(ctx);
      await Promise.resolve(ctx.adapters.fs.writeText(paths.configPath, configText));
      await Promise.resolve(ctx.adapters.fs.writeText(paths.loaderPath, generatedText));

      const cfgPath = resolveConfigFilePath(ctx.adapters.system.cwd());
      let configUpdated = false;
      let localeJsonImportBaseProject: string | undefined;
      let configInjectStatus: 'updated' | 'skipped_existing' | 'skipped_unrecognized' = 'skipped_unrecognized';
      if (cfgPath && existsRuntimeFsSync(cfgPath, ctx.adapters.fs)) {
        const projectRoot = ctx.adapters.path.dirname(cfgPath);
        const current = await Promise.resolve(ctx.adapters.fs.readText(cfgPath));
        localeJsonImportBaseProject = patchingLocaleJsonImportBaseForProjectConfig(ctx, cfgPath);
        const snippet = buildPatchingSnippet(ctx.adapters.path, {
          ...paths,
          localeJsonImportBase: localeJsonImportBaseProject,
        }, projectRoot);
        const replaced = tryReplacePatchingConfig(current, snippet);
        if (replaced.kind === 'updated' && replaced.text !== current) {
          await Promise.resolve(ctx.adapters.fs.writeText(cfgPath, replaced.text));
          configInjectStatus = 'updated';
          configUpdated = true;
        } else if (replaced.kind === 'skipped_unsure') {
          configInjectStatus = 'skipped_unrecognized';
          logManualPatchingSnippetFromText('patch --init --force', replaced.reason ?? 'unsafe to replace patching block', snippet, run);
        } else {
          const injected = tryInjectPatchingConfig(current, snippet);
          configInjectStatus = injected.kind === 'skipped_unsure' ? 'skipped_unrecognized' : injected.kind;
          if (injected.kind === 'skipped_unsure') {
            logManualPatchingSnippetFromText('patch --init --force', injected.reason ?? 'unsafe to inject patching block', snippet, run);
          } else if (injected.kind === 'updated' && injected.text !== current) {
            await Promise.resolve(ctx.adapters.fs.writeText(cfgPath, injected.text));
            configUpdated = true;
          }
        }
      }
      const msg = [
        `patch --init --force renewed ${ctx.adapters.path.basename(paths.configPath)} and ${ctx.adapters.path.basename(paths.loaderPath)} under ${paths.i18nDir} (no other files overwritten).`,
        configUpdated ? 'Patching config block was written/reset in i18nprune.config.*.' : 'No i18nprune.config.* found to update; add patching block manually if needed.',
        `Recipe: "loader_generated" (${
          localeJsonImportBaseProject != null
            ? `patching.localeJsonImportBase: ${localeJsonImportBaseProject}; generated import base: ${localeJsonImportBase}`
            : `generated import base: ${localeJsonImportBase}`
        }).`,
      ]
        .filter(Boolean)
        .join(' ');
      if (configInjectStatus === 'skipped_existing' && !run.json) {
        logger.warn(
          `patch --init --force: scaffold files under ${paths.i18nDir} were renewed, but i18nprune.config.* already has a patching block — it was left unchanged. Edit paths in that block if they are wrong, or remove it and run patch --init again for a clean inject.`,
          run,
        );
      }
      if (run.json) {
        const envelope = buildCliJsonEnvelope(
          'patch',
          {
            kind: 'patch',
            init: true,
            applied: true,
            force: true,
            paths,
            localeJsonImportBase,
            ...(localeJsonImportBaseProject != null ? { localeJsonImportBaseProject } : {}),
            configUpdated,
            configInjection: configInjectStatus,
          },
          {
            ok: true,
            issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), []),
            cwd: ctx.adapters.system.cwd(),
          },
        );
        console.log(stringifyEnvelope(envelope));
      } else {
        logger.info(msg, run);
      }
      return;
    }

    if (hasConfig && hasGeneratedModule) {
      let resetConfigBlock = false;
      const cfgPath = resolveConfigFilePath(ctx.adapters.system.cwd());
      const hasConfigFile = Boolean(cfgPath && existsRuntimeFsSync(cfgPath, ctx.adapters.fs));
      if (hasConfigFile && !run.json) {
        if (getCliYesFlag()) {
          resetConfigBlock = true;
        } else if (canAsk(run)) {
          resetConfigBlock = await duringPrompt(() =>
            confirm({
              message:
                'patch --init: scaffold files already exist. Reset patching block in i18nprune.config.* to current defaults?',
              default: false,
            }),
          );
        }
      }
      if (resetConfigBlock && cfgPath) {
        const current = await Promise.resolve(ctx.adapters.fs.readText(cfgPath));
        const projectRoot = ctx.adapters.path.dirname(cfgPath);
        const localeJsonImportBaseProject = patchingLocaleJsonImportBaseForProjectConfig(ctx, cfgPath);
        const snippet = buildPatchingSnippet(ctx.adapters.path, {
          ...paths,
          localeJsonImportBase: localeJsonImportBaseProject,
        }, projectRoot);
        const replaced = tryReplacePatchingConfig(current, snippet);
        const next = replaced.kind === 'updated' ? replaced.text : tryInjectPatchingConfig(current, snippet).text;
        if (next !== current) {
          await Promise.resolve(ctx.adapters.fs.writeText(cfgPath, next));
        }
      }
      const msg = resetConfigBlock
        ? `patch --init: scaffold already present under ${paths.i18nDir}. Reset patching config block to defaults.`
        : `patch --init skipped: scaffold already present under ${paths.i18nDir} (config.json, loaders.generated.ts). Use --init --force to renew those two CLI-owned files only.`;
      if (run.json) {
        const envelope = buildCliJsonEnvelope(
          'patch',
          {
            kind: 'patch',
            init: true,
            skipped: true,
            reason: 'files_exist',
            paths,
            existing: [paths.configPath, paths.loaderPath],
          },
          {
            ok: true,
            issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), []),
            cwd: ctx.adapters.system.cwd(),
          },
        );
        console.log(stringifyEnvelope(envelope));
      } else {
        logger.info(msg, run);
      }
      return;
    }

    const { configText, generatedText, localeJsonImportBase } = buildScaffoldFileContents(ctx);
    const writes: Array<[string, string]> = [];
    if (!hasConfig) writes.push([paths.configPath, configText]);
    if (!hasGeneratedModule) writes.push([paths.loaderPath, generatedText]);
    for (const [filePath, text] of writes) {
      await Promise.resolve(ctx.adapters.fs.writeText(filePath, text));
    }
    const cfgPath = resolveConfigFilePath(ctx.adapters.system.cwd());
    let configUpdated = false;
    let localeJsonImportBaseProjectInject: string | undefined;
    let configInjectStatus: 'updated' | 'skipped_existing' | 'skipped_unrecognized' = 'skipped_unrecognized';
    if (cfgPath && existsRuntimeFsSync(cfgPath, ctx.adapters.fs)) {
      const projectRoot = ctx.adapters.path.dirname(cfgPath);
      const current = await Promise.resolve(ctx.adapters.fs.readText(cfgPath));
      localeJsonImportBaseProjectInject = patchingLocaleJsonImportBaseForProjectConfig(ctx, cfgPath);
      const patched = tryInjectPatchingConfig(
        current,
        buildPatchingSnippet(ctx.adapters.path, {
          ...paths,
          localeJsonImportBase: localeJsonImportBaseProjectInject,
        }, projectRoot),
      );
      configInjectStatus = patched.kind === 'skipped_unsure' ? 'skipped_unrecognized' : patched.kind;
      if (patched.kind === 'skipped_unsure') {
        logManualPatchingSnippetFromText(
          'patch --init',
          patched.reason ?? 'unsafe to inject patching block',
          buildPatchingSnippet(ctx.adapters.path, {
            ...paths,
            localeJsonImportBase: localeJsonImportBaseProjectInject,
          }, projectRoot),
          run,
        );
      } else if (patched.kind === 'updated' && patched.text !== current) {
        await Promise.resolve(ctx.adapters.fs.writeText(cfgPath, patched.text));
        configUpdated = true;
      }
    }

    if (configInjectStatus === 'skipped_existing') {
      logger.warn(
        'patch --init: i18nprune.config.* already has a patching block — it was not modified (new scaffold files were still written if they were missing). To reset that block to current defaults while renewing CLI-owned scaffold files, run patch --init --force. To inject when no block exists, remove the old patching section first, then run patch --init again.',
        run,
      );
    }
    const created = writes.map(([p]) => ctx.adapters.path.basename(p)).join(', ');
    const msg = `patch --init wrote missing scaffold file(s) under ${paths.i18nDir}: ${created}. ${configUpdated ? 'Added patching config to i18nprune.config.* automatically.' : 'If missing, add patching config in i18nprune.config.*.'} Recipe: "loader_generated" (${
      localeJsonImportBaseProjectInject != null
        ? `patching.localeJsonImportBase: ${localeJsonImportBaseProjectInject}; `
        : ''
    }generated import base: ${localeJsonImportBase}).`;
    if (run.json) {
      const envelope = buildCliJsonEnvelope(
        'patch',
        {
          kind: 'patch',
          init: true,
          applied: true,
          paths,
          localeJsonImportBase,
          ...(localeJsonImportBaseProjectInject != null ? { localeJsonImportBaseProject: localeJsonImportBaseProjectInject } : {}),
          configUpdated,
          configInjection: configInjectStatus,
        },
        {
          ok: true,
          issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), []),
          cwd: ctx.adapters.system.cwd(),
        },
      );
      console.log(stringifyEnvelope(envelope));
    } else {
      logger.info(msg, run);
    }
    return;
  }

  if (missingScaffoldParts.length > 0) {
    logger.info(
      `patch: scaffold appears incomplete under ${scaffold.i18nDir} (missing: ${missingScaffoldParts.join(', ')}). Run "i18nprune patch --init" first.`,
      run,
    );
  }

  if (opts.fix && !opts.init) {
    const needsBlock =
      !patchingBlockPresent(ctx.config.patching) ||
      Boolean(buildPatchingSectionIncompleteDiagnostic(ctx.config.patching, { effectiveWantsRun: true }));
    if (needsBlock) {
      const inject = await ensurePatchingConfigBlock(ctx, { refreshIfIncomplete: true });
      if (inject.configUpdated) {
        clearContextCache();
        ctx = await resolveContext();
        logger.info('patch --fix: added patching config block to i18nprune.config.* automatically.', run);
      } else {
        logManualPatchingConfigSnippet('patch --fix', inject, run);
      }
    }
  }

  if (patchingBlockPresent(ctx.config.patching)) {
    const incomplete = buildPatchingSectionIncompleteDiagnostic(ctx.config.patching, { effectiveWantsRun: true });
    if (incomplete) logger.warn(incomplete.message, run);
  }

  if (!ctx.config.patching?.enabled) {
    logger.info(
      'patch: patching is currently disabled in config. Use "i18nprune patch --init" to scaffold and inject patching config, or set patching.enabled=true manually.',
      run,
    );
  }

  if (ctx.config.patching?.enabled && ctx.config.patching.configPath) {
    const configRepair = await repairPatchingConfigLocales({
      config: ctx.config,
      configPath: ctx.config.patching.configPath,
      run,
      fs: ctx.adapters.fs,
      top: opts.top,
      full: opts.full,
      fix: opts.fix,
    });
    if (opts.fix && configRepair.metadataRepairBlocked) {
      logger.warn(
        `patch --fix: cannot repair locale metadata in ${ctx.config.patching.configPath} while the file is not valid JSON (${configRepair.metadataRepairBlocked}). To rebuild that file and loaders.generated.ts from *.json locale files on disk plus catalog defaults, run: i18nprune patch --init --force`,
        run,
      );
    }
    if (configRepair.detectedCount > 0) {
      logger.info(
        `patch: found ${String(configRepair.detectedCount)} locale metadata inconsistency(ies) in ${ctx.config.patching.configPath}.`,
        run,
      );
    }
    if (configRepair.autofilledCount > 0) {
      logger.info(
        `patch: auto-filled ${String(configRepair.autofilledCount)} missing locale metadata field(s) in ${ctx.config.patching.configPath}.`,
        run,
      );
    }
    if (configRepair.correctedCount > 0) {
      logger.info(
        `patch: corrected ${String(configRepair.correctedCount)} catalog mismatch field(s) in ${ctx.config.patching.configPath}.`,
        run,
      );
    }
    if (configRepair.skipped) {
      logger.info('patch: kept config.json locale metadata unchanged.', run);
    }
    if (opts.fix && (configRepair.autofilledCount > 0 || configRepair.correctedCount > 0)) {
      logger.info(
        `patch --fix summary: ${String(configRepair.autofilledCount + configRepair.correctedCount)} correction(s) applied` +
          ` (${String(configRepair.autofilledCount)} autofilled, ${String(configRepair.correctedCount)} mismatch fix(es)).`,
        run,
      );
    }
  }

  let analysis = await analyzePatchingStateFromContext(ctx, {
    command: 'sync',
    action: 'upsert_locales',
    changedLocaleCodes: [],
  });

  if (opts.fix && ctx.config.patching?.enabled && (analysis.fileOnlyCodes.length > 0 || analysis.configOnlyCodes.length > 0)) {
    const changedFiles = new Set<string>();
    let appliedChanges = 0;
    if (analysis.fileOnlyCodes.length > 0) {
      const upsert = await runPatchingFromContext(ctx, {
        command: 'sync',
        action: 'upsert_locales',
        changedLocaleCodes: analysis.fileOnlyCodes,
      });
      if (upsert.applied) {
        appliedChanges += analysis.fileOnlyCodes.length;
        for (const file of upsert.changedFiles) changedFiles.add(file);
      }
    }
    if (analysis.configOnlyCodes.length > 0) {
      const del = await runPatchingFromContext(ctx, {
        command: 'locales-delete',
        action: 'delete_locales',
        changedLocaleCodes: analysis.configOnlyCodes,
      });
      if (del.applied) {
        appliedChanges += analysis.configOnlyCodes.length;
        for (const file of del.changedFiles) changedFiles.add(file);
      }
    }
    logger.info(
      `patch --fix summary: ${String(appliedChanges)} config/file drift locale correction(s) applied; ${String(changedFiles.size)} file(s) updated.`,
      run,
    );
    analysis = await analyzePatchingStateFromContext(ctx, {
      command: 'sync',
      action: 'upsert_locales',
      changedLocaleCodes: [],
    });
  }

  if (opts.fix && ctx.config.patching?.enabled && analysis.canAutoPatch) {
    const regen = await runPatchingFromContext(ctx, {
      command: 'sync',
      action: 'upsert_locales',
      changedLocaleCodes: [],
    });
    if (regen.applied) {
      logger.info(
        `patch --fix summary: regenerated ${String(regen.changedFiles.length)} patching file(s) to match config.json/locales state.`,
        run,
      );
    }
    analysis = await analyzePatchingStateFromContext(ctx, {
      command: 'sync',
      action: 'upsert_locales',
      changedLocaleCodes: [],
    });
  }

  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromPatchingDiagnostics(analysis.diagnostics),
  );

  const renewScaffoldErrorCodes = new Set([
    'i18nprune.patching.config_parse_failed',
    'i18nprune.patching.config_invalid_schema',
    'i18nprune.patching.read_failed',
    'i18nprune.patching.file_not_found',
    'i18nprune.patching.path_not_file',
  ]);
  if (
    analysis.hasError &&
    analysis.diagnostics.some((d) => d.severity === 'error' && renewScaffoldErrorCodes.has(d.code))
  ) {
    logger.tip(PATCH_RENEW_CLI_FILES, run);
  }

  if (run.json) {
    const envelope = buildCliJsonEnvelope(
      'patch',
      {
        kind: 'patch',
        analysis: {
          canAutoPatch: analysis.canAutoPatch,
          hasError: analysis.hasError,
          configOnlyCodes: analysis.configOnlyCodes,
          fileOnlyCodes: analysis.fileOnlyCodes,
          localeCount: analysis.localeRecords.length,
        },
      },
      {
        ok: !analysis.hasError,
        issues,
        cwd: ctx.adapters.system.cwd(),
      },
    );
    console.log(stringifyEnvelope(envelope));
    if (analysis.hasError) process.exitCode = 1;
  } else {
    let hasFixableWarnings = false;
    for (const d of analysis.diagnostics) {
      if (d.severity === 'error') logger.err(d.message);
      else if (d.severity === 'warn') {
        logger.warn(d.message, run);
        if (
          d.code === 'i18nprune.patching.config_locale_missing_file' ||
          d.code === 'i18nprune.patching.file_locale_missing_config' ||
          d.code === 'i18nprune.patching.catalog_mismatch_english_name' ||
          d.code === 'i18nprune.patching.catalog_mismatch_native_name' ||
          d.code === 'i18nprune.patching.catalog_mismatch_direction'
        ) {
          hasFixableWarnings = true;
        }
      }
      else logger.detail(d.message, run);
    }
    if (hasFixableWarnings) {
      logger.tip('Run "i18nprune patch --fix" to apply automatic corrections for the issues above.', run);
    } else if (!analysis.hasError) {
      const hasWarnOrErr = analysis.diagnostics.some((d) => d.severity === 'error' || d.severity === 'warn');
      if (!hasWarnOrErr) {
        if (!analysis.config.enabled) {
          logger.info(
            'patch: patching is disabled — nothing to reconcile. Turn on `patching.enabled` or pass `--patch` on generate/sync/locales to refresh loaders after edits.',
            run,
          );
        } else {
          const n = analysis.localeRecords.length;
          const recipe = analysis.config.recipe;
          if (n === 0) {
            logger.info(
              `patch: patching is on (recipe "${recipe}") but the patching config lists no locales yet. Add locale rows to your i18n config.json, then re-run patch.`,
              run,
            );
          } else {
            logger.info(
              `patch: ${String(n)} configured locale(s) — no config ↔ locale file drift and no catalog metadata mismatches. (Recipe: ${recipe}.)`,
              run,
            );
            logger.tip(
              'Pass `--patch` on generate/sync/locales (or set patching.enabled) so the generated loader stays aligned after mutations.',
              run,
            );
          }
        }
      }
    }
    process.exitCode = analysis.hasError ? 1 : 0;
  }
}
