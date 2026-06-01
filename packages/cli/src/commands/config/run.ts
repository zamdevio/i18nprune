import { resolveContext } from '@/shared/context/index.js';
import { buildConfigSnapshot } from '@/commands/config/snapshot.js';
import { runConfig } from '@/commands/config/jsonEnvelope.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/index.js';
import { getRunOptions } from '@i18nprune/core';
import { style } from '@/utils/ansi/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintPrimary } from '@/utils/logger/policy.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@i18nprune/core';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/index.js';
import type { ConfigSnapshot } from '@/types/commands/config/index.js';
import { attachWallTimer } from '@/utils/timer/index.js';

function resolveConfigData(ctx: Awaited<ReturnType<typeof resolveContext>>): {
  snapshot: ConfigSnapshot;
  jsonEnvelope: ReturnType<typeof runConfig>;
} {
  return {
    snapshot: buildConfigSnapshot(ctx),
    jsonEnvelope: runConfig(ctx),
  };
}

export async function config(): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const run = getRunOptions();
    const resolved = resolveConfigData(ctx);
    const snap = resolved.snapshot;
    const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'config' });
    const pathIssues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), readiness ?? []);

    if (run.json) {
      try {
        console.log(stringifyEnvelope(resolved.jsonEnvelope));
      } catch (err) {
        const empty = buildConfigSnapshot(ctx);
        console.log(stringifyEnvelope(buildIoReadFailureEnvelope('config', empty, ctx, err)));
        process.exitCode = 1;
        return;
      }
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
    logger.tip('i18nprune config --json  ·  see docs for I18NPRUNE_* env vars', run);
    logger.primary('', run);

    printCommandSummary(
      {
        command: 'config',
        durationMs: wall.elapsedMs(),
        issues: pathIssues,
      },
      ctx,
    );
  } finally {
    wall.dispose();
  }
}
