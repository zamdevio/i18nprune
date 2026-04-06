import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveContext } from '@/core/context/index.js';
import { configPathForContext } from '@/config/resolve/scan.js';
import { getRunOptions } from '@/core/runtime/options.js';
import type { Context } from '@/types/core/context/index.js';
import { getI18nPruneEnvSnapshot } from '@/core/context/globals.js';
import { style } from '@/utils/ansi/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintPrimary } from '@/utils/logger/policy.js';
import { printCommandSummary } from '@/core/output/index.js';
import { resolvedPathKinds } from '@/commands/config/kinds.js';
import type { ConfigSnapshot } from '@/types/commands/config/index.js';

function readCliVersion(): string {
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
    const raw = readFileSync(join(root, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export type { ConfigSnapshot };

export function buildConfigSnapshot(ctx: Context): ConfigSnapshot {
  return {
    kind: 'i18nprune.config',
    cliVersion: readCliVersion(),
    configPath: configPathForContext(),
    config: ctx.config,
    resolvedPaths: ctx.paths,
    fieldSources: ctx.meta.fieldSources,
    resolvedPathKinds: resolvedPathKinds(ctx.paths),
    env: getI18nPruneEnvSnapshot(),
    run: { ...getRunOptions() },
  };
}

export async function runConfigCommand(): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  const run = getRunOptions();
  const snap = buildConfigSnapshot(ctx);

  if (run.json) {
    console.log(JSON.stringify(snap, null, 2));
    return;
  }

  if (!canPrintPrimary(run)) {
    return;
  }

  logger.primary('', run);
  logger.primary(style.accent('  ── i18nprune config ──'), run);
  logger.primary(`  ${style.dim('cliVersion'.padEnd(16))} ${style.accent(snap.cliVersion)}`, run);
  logger.primary(
    `  ${style.dim('configPath'.padEnd(16))} ${snap.configPath ?? '(none — defaults)'}`,
    run,
  );
  logger.primary('', run);
  logger.primary(style.accent('  ── resolved paths ──'), run);
  logger.primary(`  ${style.dim('sourceLocale'.padEnd(16))} ${snap.resolvedPaths.sourceLocale}`, run);
  logger.primary(`  ${style.dim('localesDir'.padEnd(16))} ${snap.resolvedPaths.localesDir}`, run);
  logger.primary(`  ${style.dim('srcRoot'.padEnd(16))} ${snap.resolvedPaths.srcRoot}`, run);
  logger.primary('', run);
  logger.primary(style.dim('  Tip: i18nprune config --json  ·  see docs for I18NPRUNE_* env vars'), run);
  logger.primary('', run);

  printCommandSummary(
    { command: 'config', ok: true, durationMs: Date.now() - started },
    ctx,
  );
}
