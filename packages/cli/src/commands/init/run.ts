import path from 'node:path';
import process from 'node:process';
import { buildInitJsonEnvelope } from '@/commands/init/jsonEnvelope.js';
import { defaultInitConfigFileName, issueCodeDocHref, runInit } from '@i18nprune/core';
import type { InitRunResult } from '@i18nprune/core';
import { resolveConfigFilePath } from '@/shared/config/index.js';
import { CONFIG_BASE_NAME } from '@/constants/cli.js';
import { getRunOptions } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { existsRuntimeFsSync } from '@i18nprune/core/runtime/helpers/sync';
import { getArgvJsonFlag } from '@/shared/context/globals.js';
import { shouldSkipInteractivePrompts } from '@/utils/interactive/index.js';
import { logger } from '@/utils/logger/index.js';
import {
  confirmWriteConfig,
  promptConfigFormat,
  promptInitPresetAfterAmbiguousAuto,
} from '@/commands/init/prompts.js';
import type { EnsureConfigOptions } from '@/types/config/init.js';
import { resolveContext, clearContextCache } from '@/shared/context/index.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { stringifyEnvelope } from '@i18nprune/core';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { configFileNameForFormat } from '@i18nprune/core';

async function emitInitWorkspaceGuidance(): Promise<void> {
  const run = getRunOptions();
  const cwd = process.cwd();
  try {
    clearContextCache();
    const ctx = await resolveContext();
    const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'init' });
    if (readiness?.length && readiness[0]) logger.warn(readiness[0].message, run);

    const localesRel = path.relative(cwd, ctx.paths.localesDir) || ctx.paths.localesDir;
    const sourceRel = path.relative(cwd, ctx.paths.sourceLocale) || ctx.paths.sourceLocale;

    logger.info(
      `Next: ensure your locales directory exists (\`${localesRel}\` — from \`localesDir\` in config). Create or fix \`${sourceRel}\` as JSON for the source locale. Point \`src\` at your application sources. Run \`i18nprune doctor\` for a full path check.`,
      run,
    );

    if (readiness?.length) {
      logger.info(
        'If you see discovery or path warnings below, align `source`, `localesDir`, and `src` with your repo and keep this config next to the project root where you run i18nprune.',
        run,
      );
    }

    const seen = new Set<string>();
    for (const issue of readiness ?? []) {
      if (seen.has(issue.code)) continue;
      seen.add(issue.code);
      const href = issue.docHref ?? issueCodeDocHref(issue.code);
      logger.warn(`issue: ${issue.code} · ${href}`, run);
    }
  } catch {
    /* brand-new or invalid config — skip */
  }
}

function createInitHost(cwd: string, skippedExistingConfig: boolean) {
  const adapters = createNodeRuntimeAdapters();
  return {
    host: {
      fs: adapters.fs,
      path: adapters.path,
      projectRoot: cwd,
      skippedExistingConfig,
    },
    fs: adapters.fs,
  };
}

function canPromptAmbiguousAuto(opts: EnsureConfigOptions, nonInteractiveInit: boolean): boolean {
  return (
    Boolean(opts.auto) &&
    !nonInteractiveInit &&
    Boolean(process.stdin.isTTY) &&
    Boolean(process.stdout.isTTY)
  );
}

function logInitIssues(plan: InitRunResult, run: ReturnType<typeof getRunOptions>): void {
  for (const issue of plan.issues) {
    if (issue.severity === 'error') logger.err(issue.message);
    else logger.warn(issue.message, run);
  }
}

export async function ensureConfig(opts: EnsureConfigOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const existing = resolveConfigFilePath(cwd);
  const nonInteractiveInit = shouldSkipInteractivePrompts() || opts.yes || getArgvJsonFlag();
  const run = getRunOptions();
  const runOpts = {
    auto: Boolean(opts.auto),
    preset: opts.preset,
    rich: Boolean(opts.rich),
  };

  if (existing) {
    const rel = path.relative(cwd, existing);
    const display = rel && !rel.startsWith('..') ? rel : existing;
    logger.info(`Config already exists (${display}) — nothing to create.`, getRunOptions());
    if (run.json) {
      const envelope = buildInitJsonEnvelope({ cwd, skippedExistingConfig: true, runOpts });
      console.log(stringifyEnvelope(envelope));
      applyCliCiExitGate(envelope.ok);
    }
    await emitInitWorkspaceGuidance();
    return;
  }

  const { host, fs } = createInitHost(cwd, false);

  if (run.json) {
    const envelope = buildInitJsonEnvelope({ cwd, skippedExistingConfig: false, runOpts });
    console.log(stringifyEnvelope(envelope));
    applyCliCiExitGate(envelope.ok);
    if (envelope.ok && envelope.data.proposedConfigSource && nonInteractiveInit) {
      const target = path.join(cwd, defaultInitConfigFileName(CONFIG_BASE_NAME));
      if (!existsRuntimeFsSync(target, fs)) {
        await Promise.resolve(fs.writeText(target, envelope.data.proposedConfigSource));
        logger.info(`Wrote default ${target}`);
      }
      await emitInitWorkspaceGuidance();
    }
    return;
  }

  let plan = runInit(host, runOpts);

  if (plan.exitCode !== 0) {
    const ambiguousAuto = plan.issues.some((i) => i.code === 'i18nprune.init.ambiguous_auto');
    if (ambiguousAuto && canPromptAmbiguousAuto(opts, nonInteractiveInit)) {
      logger.warn(
        'Auto-detect could not pick a unique preset — choose one below, or press Ctrl+C and re-run with `--preset <id>`.',
        run,
      );
      const picked = await promptInitPresetAfterAmbiguousAuto(run);
      plan = runInit(host, { ...runOpts, auto: false, preset: picked });
    }
  }

  if (plan.exitCode !== 0) {
    logInitIssues(plan, run);
    applyCliCiExitGate(false);
    return;
  }

  const body = plan.payload.proposedConfigSource;
  if (!body) {
    logger.warn('Init produced no config body — nothing to create.', run);
    applyCliCiExitGate(false);
    return;
  }

  if (nonInteractiveInit) {
    const target = path.join(cwd, defaultInitConfigFileName(CONFIG_BASE_NAME));
    if (!existsRuntimeFsSync(target, fs)) {
      await Promise.resolve(fs.writeText(target, body));
      logger.info(`Wrote default ${target}`);
    }
    await emitInitWorkspaceGuidance();
    return;
  }

  const fmt = await promptConfigFormat(getRunOptions());
  const fileName = configFileNameForFormat(CONFIG_BASE_NAME, fmt);
  const target = path.join(cwd, fileName);
  if (!(await confirmWriteConfig(fileName))) {
    logger.warn('Skipping config file; using built-in defaults for this run.');
    return;
  }
  await Promise.resolve(fs.writeText(target, body));
  logger.info(`Created ${target}`);
  await emitInitWorkspaceGuidance();
}
