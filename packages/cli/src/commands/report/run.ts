import { resolveContext } from '@/core/context/index.js';
import { getRunOptions } from '@/core/runtime/options.js';
import { buildIoReadFailureEnvelope } from '@/core/result/ioEnvelope.js';
import { stringifyEnvelope } from '@/core/result/cliJson.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDecorative } from '@/utils/logger/policy.js';
import type { ReportCliJsonPayload } from '@/types/command/report/json.js';
import type { ReportCliRunOptions } from '@/types/command/report/index.js';
import type { ProjectReportDocument } from '@/types/command/report/index.js';
import { runReportOperation } from '@/commands/report/buildEnvelope.js';

export type { ReportCliRunOptions };

export async function report(opts: ReportCliRunOptions): Promise<void> {
  const r = getRunOptions();
  let envelope: Awaited<ReturnType<typeof runReportOperation>>['envelope'];
  let wrotePath: string | null;

  try {
    const out = await runReportOperation(opts);
    envelope = out.envelope;
    wrotePath = out.wrotePath;
  } catch (err) {
    if (!r.json) throw err;
    let ctx: ReturnType<typeof resolveContext> | null = null;
    try {
      ctx = resolveContext();
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

  if (!wrotePath) {
    if (canPrintDecorative(r)) {
      const requested =
        opts.out !== undefined && opts.out.length > 0
          ? opts.out
          : '(default report path in cwd)';
      logger.primary(`Skipped report write for ${requested}`, r);
    }
    return;
  }

  if (canPrintDecorative(r)) {
    logger.primary(`Wrote ${wrotePath}`, r);
  }
}
