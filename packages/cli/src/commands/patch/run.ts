import { resolveContext } from '@/shared/context/index.js';
import { resolveConfigFilePath } from '@/shared/config/index.js';
import { confirm } from '@inquirer/prompts';
import {
  analyzePatchingState,
  buildPatchingSectionIncompleteDiagnostic,
  patchingBlockPresent,
  existsRuntimeFsSync,
  getRunOptions,
  runPatching,
} from '@i18nprune/core';
import { buildCliJsonEnvelope, stringifyEnvelope } from '@i18nprune/core';
import {
  issuesFromDiscoveryWarnings,
  issuesFromPatchingDiagnostics,
  mergeIssues,
} from '@/shared/result/index.js';
import { getDisplaySourceLocaleCode } from '@/shared/locales/index.js';
import { logger } from '@/utils/logger/index.js';
import {
  buildScaffoldFileContents,
  patchingLocaleJsonImportBaseForProjectConfig,
  resolvePatchScaffoldPaths,
  resolvePatchingProjectRoot,
} from '@/shared/patching/scaffoldI18nLayout.js';
import { repairPatchingConfigLocales } from '@/shared/patching/configLocales.js';
import { replaceStartBeforePropertyKey } from '@/shared/patching/replaceConfigPatchingBlock.js';
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

/** Indent for `patching:` at defineConfig depth (2 spaces → inner fields at 4, closing brace at 2). */
const PATCHING_CONFIG_BODY_INDENT = '  ';

function toProjectRelativePath(
  pathMod: Awaited<ReturnType<typeof resolveContext>>['adapters']['path'],
  projectRoot: string,
  absolutePath: string,
): string {
  return pathMod.relative(projectRoot, absolutePath).replace(/\\/g, '/') || '.';
}

function buildPatchingSnippet(
  pathMod: Awaited<ReturnType<typeof resolveContext>>['adapters']['path'],
  paths: {
    configPath: string;
    loaderPath: string;
    localeJsonImportBase: string;
  },
  projectRoot: string,
): string {
  const bi = PATCHING_CONFIG_BODY_INDENT;
  const rel = (abs: string): string => toProjectRelativePath(pathMod, projectRoot, abs);
  const inner = `${bi}  `;
  return [
    `${bi}patching: {`,
    `${inner}enabled: true,`,
    `${inner}recipe: "loader_generated",`,
    `${inner}configPath: "${rel(paths.configPath)}",`,
    `${inner}loaderPath: "${rel(paths.loaderPath)}",`,
    `${inner}localeJsonImportBase: "${paths.localeJsonImportBase}",`,
    `${bi}},`,
  ].join('\n');
}

function tryInjectPatchingConfig(fileText: string, snippet: string): {
  kind: 'updated' | 'skipped_existing' | 'skipped_unrecognized';
  text: string;
} {
  if (/\bpatching\s*:/.test(fileText)) return { kind: 'skipped_existing', text: fileText };
  const marker = /export\s+default\s+defineConfig\(\{\n?/;
  const matched = fileText.match(marker);
  if (!matched || matched.index == null) return { kind: 'skipped_unrecognized', text: fileText };
  const insertAt = matched.index + matched[0].length;
  return { kind: 'updated', text: `${fileText.slice(0, insertAt)}${snippet}\n${fileText.slice(insertAt)}` };
}

function tryReplacePatchingConfig(fileText: string, snippet: string): {
  kind: 'updated' | 'skipped_missing' | 'skipped_unrecognized';
  text: string;
} {
  const keyRe = /\bpatching\s*:\s*\{/g;
  const m = keyRe.exec(fileText);
  if (!m || m.index == null) return { kind: 'skipped_missing', text: fileText };
  const braceStart = fileText.indexOf('{', m.index);
  if (braceStart < 0) return { kind: 'skipped_unrecognized', text: fileText };
  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < fileText.length; i += 1) {
    const ch = fileText[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) return { kind: 'skipped_unrecognized', text: fileText };
  let tailEnd = end;
  while (tailEnd < fileText.length && /\s/.test(fileText[tailEnd]!)) tailEnd += 1;
  if (fileText[tailEnd] === ',') tailEnd += 1;
  const replaceStart = replaceStartBeforePropertyKey(fileText, m.index);
  return {
    kind: 'updated',
    text: `${fileText.slice(0, replaceStart)}${snippet}${fileText.slice(tailEnd)}`,
  };
}

export async function patch(opts: PatchCommandOptions): Promise<void> {
  const run = getRunOptions();
  const ctx = await resolveContext();

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
    if (readiness[0]) logger.warn(readiness[0].message, run);
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
        } else {
          const injected = tryInjectPatchingConfig(current, snippet);
          configInjectStatus = injected.kind;
          if (injected.kind === 'updated' && injected.text !== current) {
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
      configInjectStatus = patched.kind;
      if (patched.kind === 'updated' && patched.text !== current) {
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

  const patchingProjectRoot = resolvePatchingProjectRoot(ctx);

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

  let analysis = await analyzePatchingState({
    command: 'sync',
    action: 'upsert_locales',
    changedLocaleCodes: [],
    sourceLocaleCode: getDisplaySourceLocaleCode(ctx),
    config: ctx.config.patching,
    runtime: { fs: ctx.adapters.fs, path: ctx.adapters.path },
    projectRoot: patchingProjectRoot,
  });

  if (opts.fix && ctx.config.patching?.enabled && (analysis.fileOnlyCodes.length > 0 || analysis.configOnlyCodes.length > 0)) {
    const changedFiles = new Set<string>();
    let appliedChanges = 0;
    if (analysis.fileOnlyCodes.length > 0) {
      const upsert = await runPatching({
        command: 'sync',
        action: 'upsert_locales',
        changedLocaleCodes: analysis.fileOnlyCodes,
        sourceLocaleCode: getDisplaySourceLocaleCode(ctx),
        config: ctx.config.patching,
        runtime: { fs: ctx.adapters.fs, path: ctx.adapters.path },
        projectRoot: patchingProjectRoot,
      });
      if (upsert.applied) {
        appliedChanges += analysis.fileOnlyCodes.length;
        for (const file of upsert.changedFiles) changedFiles.add(file);
      }
    }
    if (analysis.configOnlyCodes.length > 0) {
      const del = await runPatching({
        command: 'locales-delete',
        action: 'delete_locales',
        changedLocaleCodes: analysis.configOnlyCodes,
        sourceLocaleCode: getDisplaySourceLocaleCode(ctx),
        config: ctx.config.patching,
        runtime: { fs: ctx.adapters.fs, path: ctx.adapters.path },
        projectRoot: patchingProjectRoot,
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
    analysis = await analyzePatchingState({
      command: 'sync',
      action: 'upsert_locales',
      changedLocaleCodes: [],
      sourceLocaleCode: getDisplaySourceLocaleCode(ctx),
      config: ctx.config.patching,
      runtime: { fs: ctx.adapters.fs, path: ctx.adapters.path },
      projectRoot: patchingProjectRoot,
    });
  }

  if (opts.fix && ctx.config.patching?.enabled && analysis.canAutoPatch) {
    const regen = await runPatching({
      command: 'sync',
      action: 'upsert_locales',
      changedLocaleCodes: [],
      sourceLocaleCode: getDisplaySourceLocaleCode(ctx),
      config: ctx.config.patching,
      runtime: { fs: ctx.adapters.fs, path: ctx.adapters.path },
      projectRoot: patchingProjectRoot,
    });
    if (regen.applied) {
      logger.info(
        `patch --fix summary: regenerated ${String(regen.changedFiles.length)} patching file(s) to match config.json/locales state.`,
        run,
      );
    }
    analysis = await analyzePatchingState({
      command: 'sync',
      action: 'upsert_locales',
      changedLocaleCodes: [],
      sourceLocaleCode: getDisplaySourceLocaleCode(ctx),
      config: ctx.config.patching,
      runtime: { fs: ctx.adapters.fs, path: ctx.adapters.path },
      projectRoot: patchingProjectRoot,
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
    logger.info(PATCH_RENEW_CLI_FILES, run);
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
      logger.info('patch: detected fixable inconsistencies. Run "i18nprune patch --fix" to apply automatic corrections.', run);
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
            logger.detail(
              'Tip: pass `--patch` on generate/sync/locales (or set patching.enabled) so the generated loader stays aligned after mutations.',
              run,
            );
          }
        }
      }
    }
    process.exitCode = analysis.hasError ? 1 : 0;
  }
}
