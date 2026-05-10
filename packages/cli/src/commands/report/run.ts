import { resolveContext } from '@/shared/context/index.js';
import { getRunOptions } from '@i18nprune/core';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import { stringifyEnvelope } from '@/shared/result/cliJson.js';
import { printCommandSummary } from '@/output/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo, canPrintWarn } from '@/utils/logger/policy.js';
import type { ReportCliJsonPayload } from '@/types/command/report/json.js';
import type { ReportCliRunOptions } from '@/types/command/report/index.js';
import type { ProjectReportDocument } from '@/types/command/report/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import { runReportOperation } from '@/commands/report/buildEnvelope.js';
import { resolveExtractionBaselineCounts } from '@/shared/cache/index.js';
import { attachWallTimer } from '@/utils/timer/index.js';

export type { ReportCliRunOptions };

function printHumanReportSummary(
  wall: { elapsedMs(): number },
  envelope: CliJsonEnvelope<'report', ReportCliJsonPayload>,
  ctx: Context,
): void {
  const sum = envelope.data.document.summary;
  printCommandSummary(
    {
      command: 'report',
      ok: envelope.ok !== false,
      durationMs: wall.elapsedMs(),
      counts: {
        filesScanned: sum.sourceFilesScannedCount ?? 0,
        missing: sum.missingKeysCount,
        ...resolveExtractionBaselineCounts(ctx),
      },
      issues: envelope.issues,
    },
    ctx,
  );
}

export async function report(opts: ReportCliRunOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const r = getRunOptions();
    let envelope: Awaited<ReturnType<typeof runReportOperation>>['envelope'];
    let wrotePath: string | null;
    let dynamicSitesCount = 0;
    let reportCtx!: Context;

    try {
      const out = await runReportOperation(opts);
      envelope = out.envelope;
      wrotePath = out.wrotePath;
      dynamicSitesCount = out.dynamicSitesCount;
      reportCtx = out.ctx;
    } catch (err) {
      if (!r.json) throw err;
      let ctx: Awaited<ReturnType<typeof resolveContext>> | null = null;
      try {
        ctx = await resolveContext();
      } catch {
        /* resolution failed — still emit I/O envelope */
      }
      const empty: ReportCliJsonPayload = {
        kind: 'report',
        format: opts.format,
        outputPath: null,
        document: {} as ProjectReportDocument,
      };
      envelope = buildIoReadFailureEnvelope('report', empty, ctx, err);
      console.log(stringifyEnvelope(envelope));
      process.exitCode = 1;
      return;
    }

    if (r.json) {
      console.log(stringifyEnvelope(envelope));
      if (!envelope.ok) {
        process.exitCode = 1;
      }
      return;
    }

    if (dynamicSitesCount > 0 && canPrintWarn(r)) {
      logger.warn(
        `${String(dynamicSitesCount)} translation call(s) use a non-literal key — counts are captured in this report snapshot; open the report or run \`locales dynamic\` for call-site lines.`,
        r,
      );
    }

    if (!wrotePath) {
      if (canPrintInfo(r)) {
        const requested =
          opts.out !== undefined && opts.out.length > 0
            ? opts.out
            : '(default report path in cwd)';
        logger.info(`Skipped report write for ${requested}`, r);
      }
      printHumanReportSummary(wall, envelope, reportCtx);
      return;
    }

    if (canPrintInfo(r)) {
      logger.info(`Wrote ${wrotePath}`, r);
    }

    printHumanReportSummary(wall, envelope, reportCtx);
  } finally {
    wall.dispose();
  }
}
