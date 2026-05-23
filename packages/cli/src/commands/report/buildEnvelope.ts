import path from 'node:path';
import { resolveContext } from '@/shared/context/index.js';
import { buildCliJsonEnvelope } from '@i18nprune/core';
import {
  issuesFromDiscoveryWarnings,
  mergeIssues,
} from '@/shared/result/index.js';
import { projectReportDocumentSchema } from '@i18nprune/report-schema';
import { formatProjectReportDocument } from '@/commands/report/write.js';
import { resolveReportOutputPath } from '@/utils/report/index.js';
import { runReport as runReportCore, runProjectReadiness } from '@i18nprune/core';
import type { ReportHostHooks, ReportRunOptions } from '@i18nprune/core';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import type { Context } from '@/types/core/context/index.js';
import type { ReportCliJsonPayload } from '@/types/command/report/json.js';
import type { ReportCliRunOptions } from '@/types/command/report/index.js';
import type { CliJsonEnvelope } from '@i18nprune/core';
import { existsRuntimeFsSync, readJsonFromRuntimeFsSync } from '@i18nprune/core/runtime/helpers/sync';
import { CLI_VERSION } from '@/constants/cli.js';
import { buildReportEnvironmentSnapshot } from '@/commands/report/build.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import { randomUUID } from 'node:crypto';

function localTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function defaultOutBasename(format: ReportCliRunOptions['format']): string {
  const ext = format === 'html' ? 'html' : format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'txt';
  return `report-${localTimestamp(new Date())}.${ext}`;
}

function parseReportJsonFromFile(filePath: string, fsPort: Context['adapters']['fs']): unknown {
  let parsed: unknown;
  try {
    parsed = readJsonFromRuntimeFsSync(filePath, fsPort);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Cannot read --from file ${filePath}: ${msg}`);
  }
  const result = projectReportDocumentSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const at = issue?.path?.length ? ` at ${issue.path.join('.')}` : '';
    throw new Error(
      `Report file does not match project report schema${at}: ${issue?.message ?? 'invalid document'}`,
    );
  }
  return result.data;
}

function buildReportHostHooks(ctx: Context): ReportHostHooks {
  return {
    emit: createCliRunEmitter(ctx.run),
    runId: randomUUID(),
    environment: buildReportEnvironmentSnapshot(ctx.adapters.fs),
    cwd: process.cwd(),
    toolVersion: CLI_VERSION,
  };
}

/**
 * Build/write report file and the `report` JSON envelope.
 */
export async function runReportOperation(
  opts: ReportCliRunOptions,
): Promise<{
  envelope: CliJsonEnvelope<'report', ReportCliJsonPayload>;
  wrotePath: string | null;
  dynamicSitesCount: number;
  ctx: Context;
}> {
  const ctx = await resolveContext();
  const host = buildReportHostHooks(ctx);

  const coreOpts: ReportRunOptions = opts.from
    ? { source: 'file', preloadedDocument: parseReportJsonFromFile(opts.from, ctx.adapters.fs) }
    : { source: 'project' };

  if (!opts.from) {
    const pr = runProjectReadiness(createCliCoreContext(ctx), { mode: 'preset', preset: 'report' });
    if (!pr.ok) {
      const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), pr.issues);
      const envelope = buildCliJsonEnvelope(
        'report',
        {
          kind: 'report' as const,
          format: opts.format,
          outputPath: null,
          document: {} as import('@/types/command/report/index.js').ProjectReportDocument,
        },
        { ok: false, issues, cwd: ctx.adapters.system.cwd() },
      );
      return { envelope, wrotePath: null, dynamicSitesCount: 0, ctx };
    }
  }

  const coreCtx = createCliCoreContext(ctx);
  const result = runReportCore(coreCtx, coreOpts, host);

  const doc = result.payload.document;
  const body = formatProjectReportDocument(opts.format, doc as import('@/types/command/report/index.js').ProjectReportDocument);
  const requestedTarget =
    opts.out !== undefined && opts.out.length > 0
      ? path.resolve(opts.out)
      : path.join(process.cwd(), defaultOutBasename(opts.format));

  const target = await resolveReportOutputPath(requestedTarget);
  let wrotePath: string | null = null;
  if (target) {
    const fsPort = ctx.adapters.fs;
    const dir = path.dirname(target);
    if (!existsRuntimeFsSync(dir, fsPort)) await Promise.resolve(fsPort.mkdirp(dir));
    await Promise.resolve(fsPort.writeText(target, body));
    wrotePath = target;
  }

  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    result.issues,
  );

  const payload: ReportCliJsonPayload = {
    kind: 'report',
    format: opts.format,
    outputPath: wrotePath,
    document: doc as import('@/types/command/report/index.js').ProjectReportDocument,
  };
  const envelope = buildCliJsonEnvelope('report', payload, {
    ok: true,
    issues,
    cwd: process.cwd(),
  });
  return { envelope, wrotePath, dynamicSitesCount: result.dynamicSitesCount, ctx };
}
