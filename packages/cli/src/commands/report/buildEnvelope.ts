import path from 'node:path';
import { resolveContext } from '@/shared/context/index.js';
import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { projectReportDocumentSchema } from '@i18nprune/report';
import { formatProjectReportDocument } from '@/commands/report/write.js';
import { resolveReportOutputPath } from '@/utils/report/index.js';
import { resolveCachedProjectReportDocument } from '@/shared/cache/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { ProjectReportDocument } from '@/types/command/report/index.js';
import type { ReportCliJsonPayload } from '@/types/command/report/json.js';
import type { ReportCliRunOptions } from '@/types/command/report/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import { readRuntimeFsTextSync, existsRuntimeFsSync } from '@i18nprune/core/runtime/helpers/sync';

function localTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function defaultOutBasename(format: ReportCliRunOptions['format']): string {
  const ext = format === 'html' ? 'html' : format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'txt';
  return `report-${localTimestamp(new Date())}.${ext}`;
}

function parseReportJsonFromFile(filePath: string, fsPort: Awaited<ReturnType<typeof resolveContext>>['adapters']['fs']): ProjectReportDocument {
  let raw: string;
  try {
    raw = readRuntimeFsTextSync(filePath, fsPort);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Cannot read --from file ${filePath}: ${msg}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid JSON in --from file ${filePath}: ${msg}`);
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

function resolveReportDocument(ctx: Awaited<ReturnType<typeof resolveContext>>, opts: ReportCliRunOptions): ProjectReportDocument {
  if (opts.from) {
    return parseReportJsonFromFile(opts.from, ctx.adapters.fs);
  }
  return resolveCachedProjectReportDocument(ctx);
}

/**
 * Build/write report file and the `report` JSON envelope (same document as embedded in HTML when format is html).
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
  const fsPort = ctx.adapters.fs;
  const doc = resolveReportDocument(ctx, opts);

  const body = formatProjectReportDocument(opts.format, doc);
  const requestedTarget =
    opts.out !== undefined && opts.out.length > 0
      ? path.resolve(opts.out)
      : path.join(process.cwd(), defaultOutBasename(opts.format));

  const target = await resolveReportOutputPath(requestedTarget);
  let wrotePath: string | null = null;
  if (target) {
    const dir = path.dirname(target);
    if (!existsRuntimeFsSync(dir, fsPort)) await Promise.resolve(fsPort.mkdirp(dir));
    await Promise.resolve(fsPort.writeText(target, body));
    wrotePath = target;
  }

  const dynamicSitesRaw = doc.details.dynamicSites as unknown[] | undefined;
  const dynamicSitesCount = Array.isArray(dynamicSitesRaw) ? dynamicSitesRaw.length : 0;
  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSitesCount),
  );
  const payload: ReportCliJsonPayload = {
    kind: 'report',
    format: opts.format,
    outputPath: wrotePath,
    document: doc,
  };
  const envelope = buildCliJsonEnvelope('report', payload, {
    ok: true,
    issues,
    cwd: process.cwd(),
  });
  return { envelope, wrotePath, dynamicSitesCount, ctx };
}
