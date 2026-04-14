import { resolveContext } from '@/core/context/index.js';
import { buildConfigSnapshot } from '@/core/config/snapshot.js';
import { runConfig } from '@/core/config/jsonEnvelope.js';
import { buildIoReadFailureEnvelope } from '@/core/result/ioEnvelope.js';
import { getRunOptions } from '@/core/runtime/options.js';
import { style } from '@/utils/ansi/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintPrimary } from '@/utils/logger/policy.js';
import { printCommandSummary } from '@/core/output/index.js';
import { stringifyEnvelope } from '@/core/result/cliJson.js';
import { issuesFromDiscoveryWarnings } from '@/core/result/cliEnvelopeIssues.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import type { ConfigSnapshot } from '@/types/commands/config/index.js';

export type { ConfigSnapshot };
export { buildConfigSnapshot } from '@/core/config/snapshot.js';

export async function config(): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  const run = getRunOptions();
  const snap = buildConfigSnapshot(ctx);

  if (run.json) {
    try {
      console.log(stringifyEnvelope(runConfig(ctx)));
    } catch (err) {
      const empty = buildConfigSnapshot(ctx);
      console.log(stringifyEnvelope(buildIoReadFailureEnvelope('config', empty, ctx, err)));
      process.exitCode = 1;
      await finalizeReportFile(ctx.config, {
        command: 'config',
        ok: false,
        durationMs: Date.now() - started,
        counts: {},
      });
      return;
    }
    pushReportEntry({
      command: 'config',
      level: 'info',
      message: 'config snapshot emitted',
      data: { hasConfigFile: snap.configPath !== null },
    });
    await finalizeReportFile(ctx.config, {
      command: 'config',
      durationMs: Date.now() - started,
      counts: { hasConfigFile: snap.configPath ? 1 : 0 },
    });
    return;
  }

  if (!canPrintPrimary(run)) {
    pushReportEntry({
      command: 'config',
      level: 'info',
      message: 'config completed',
      data: { hasConfigFile: snap.configPath !== null },
    });
    finalizeReportFile(ctx.config, {
      command: 'config',
      durationMs: Date.now() - started,
      counts: { hasConfigFile: snap.configPath ? 1 : 0 },
    });
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
  pushReportEntry({
    command: 'config',
    level: 'info',
    message: 'config completed',
    data: { hasConfigFile: snap.configPath !== null },
  });
  finalizeReportFile(ctx.config, {
    command: 'config',
    durationMs: Date.now() - started,
    counts: { hasConfigFile: snap.configPath ? 1 : 0 },
  });

  printCommandSummary(
    {
      command: 'config',
      ok: true,
      durationMs: Date.now() - started,
      issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
    },
    ctx,
  );
}
