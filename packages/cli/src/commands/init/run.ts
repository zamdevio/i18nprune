import path from 'node:path';
import {
  buildInitConfigTemplate,
  configFileNameForFormat,
  defaultInitConfigFileName,
  issueCodeDocHref,
} from '@i18nprune/core';
import { resolveConfigFilePath } from '@/shared/config/index.js';
import { CONFIG_BASE_NAME } from '@/constants/cli.js';
import { getRunOptions } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { existsRuntimeFsSync } from '@i18nprune/core/runtime/helpers/sync';
import { getArgvJsonFlag } from '@/shared/context/globals.js';
import { shouldSkipInteractivePrompts } from '@/utils/interactive/index.js';
import { logger } from '@/utils/logger/index.js';
import { confirmWriteConfig, promptConfigFormat } from '@/commands/init/prompts.js';
import type { EnsureConfigOptions } from '@/types/config/init.js';
import { resolveContext, clearContextCache } from '@/shared/context/index.js';
import { cliReadinessIssues } from '@/shared/project/index.js';

async function emitInitWorkspaceGuidance(): Promise<void> {
  try {
    clearContextCache();
    const ctx = await resolveContext();
    const run = getRunOptions();
    const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'init' });
    if (!readiness?.length) return;
    if (readiness[0]) logger.warn(readiness[0].message, run);
    logger.info(
      'Next: ensure `locales/` exists next to your config (or set `localesDir` in config). Add `locales/<source>.json` where `<source>` is your configured **source locale** code (e.g. `source: "en"` → `locales/en.json`), as a JSON object. Point `src` at your application root. Run `i18nprune doctor` for a full path check.',
      run,
    );
    const seen = new Set<string>();
    for (const issue of readiness) {
      if (seen.has(issue.code)) continue;
      seen.add(issue.code);
      const href = issue.docHref ?? issueCodeDocHref(issue.code);
      logger.warn(`issue: ${issue.code} · ${href}`, run);
    }
  } catch {
    /* brand-new or invalid config — skip */
  }
}

export async function ensureConfig(opts: EnsureConfigOptions = {}): Promise<void> {
  const adapters = createNodeRuntimeAdapters();
  const fs = adapters.fs;
  const cwd = process.cwd();
  const existing = resolveConfigFilePath(cwd);
  if (existing) {
    const rel = path.relative(cwd, existing);
    const display = rel && !rel.startsWith('..') ? rel : existing;
    logger.info(`Config already exists (${display}) — nothing to create.`, getRunOptions());
    await emitInitWorkspaceGuidance();
    return;
  }
  const nonInteractiveInit = shouldSkipInteractivePrompts() || opts.yes || getArgvJsonFlag();
  if (nonInteractiveInit) {
    const target = path.join(cwd, defaultInitConfigFileName(CONFIG_BASE_NAME));
    if (!existsRuntimeFsSync(target, fs)) {
      await Promise.resolve(fs.writeText(target, buildInitConfigTemplate({ rich: opts.rich })));
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
  await Promise.resolve(fs.writeText(target, buildInitConfigTemplate({ rich: opts.rich })));
  logger.info(`Created ${target}`);
  await emitInitWorkspaceGuidance();
}
