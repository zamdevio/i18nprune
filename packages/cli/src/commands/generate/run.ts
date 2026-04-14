import { resolveContext } from '@/core/context/index.js';
import { executeGenerate } from '@/core/generate/execute.js';
import { runGenerate } from '@/core/generate/runGenerate.js';
import { printCommandSummary } from '@/core/output/index.js';
import { stringifyEnvelope } from '@/core/result/cliJson.js';
import { mergeGenerateOptionsFromEnv } from '@/commands/generate/env.js';
import type { GenerateOptions } from '@/types/command/generate/index.js';
import type { Issue } from '@/types/core/json/envelope.js';
import { logger } from '@/utils/logger/index.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';

export async function generate(opts: GenerateOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  const merged = mergeGenerateOptionsFromEnv(opts);

  for (const w of ctx.meta.warnings) {
    logger.detail(w, ctx.run);
  }

  if (ctx.run.json) {
    const envelope = await runGenerate(ctx, opts);
    console.log(stringifyEnvelope(envelope));
    if (!envelope.ok) {
      process.exitCode = 1;
      await finalizeReportFile(ctx.config, {
        command: 'generate',
        ok: false,
        durationMs: Date.now() - started,
        counts: {},
      });
      return;
    }
    const payload = envelope.data;
    pushReportEntry({
      level: 'info',
      command: 'generate',
      message: merged.dryRun ? 'generate dry-run completed' : 'generate completed',
      data: {
        targets: payload.targets,
        dryRun: Boolean(merged.dryRun),
        leaves: payload.leavesProcessed,
        dynamicKeySites: payload.dynamicKeySites,
      },
    });
    await finalizeReportFile(ctx.config, {
      command: 'generate',
      ok: true,
      durationMs: Date.now() - started,
      counts: {
        locales: payload.targets.length,
        leaves: payload.leavesProcessed,
        dynamicKeySites: payload.dynamicKeySites,
      },
    });
    return;
  }

  let payload: Awaited<ReturnType<typeof executeGenerate>>['payload'];
  let issues: Awaited<ReturnType<typeof executeGenerate>>['issues'];
  try {
    const out = await executeGenerate(ctx, merged);
    payload = out.payload;
    issues = out.issues;
  } catch (err) {
    if (err && typeof err === 'object' && 'issues' in err) {
      const embedded = (err as { issues?: Issue[] }).issues;
      if (embedded && embedded.length > 0) {
        printCommandSummary(
          {
            command: 'generate',
            ok: false,
            durationMs: Date.now() - started,
            issues: embedded,
          },
          ctx,
        );
        process.exitCode = 1;
        return;
      }
    }
    throw err;
  }
  const durationMs = Date.now() - started;

  pushReportEntry({
    level: 'info',
    command: 'generate',
    message: merged.dryRun ? 'generate dry-run completed' : 'generate completed',
    data: {
      targets: payload.targets,
      dryRun: Boolean(merged.dryRun),
      leaves: payload.leavesProcessed,
      dynamicKeySites: payload.dynamicKeySites,
    },
  });
  await finalizeReportFile(ctx.config, {
    command: 'generate',
    ok: true,
    durationMs,
    counts: {
      locales: payload.targets.length,
      leaves: payload.leavesProcessed,
      dynamicKeySites: payload.dynamicKeySites,
    },
  });

  printCommandSummary(
    {
      command: 'generate',
      ok: true,
      durationMs,
      counts: {
        locales: payload.targets.length,
        leaves: payload.leavesProcessed,
        dynamicKeySites: payload.dynamicKeySites,
      },
      issues,
    },
    ctx,
  );
}
