import { buildReportDocument } from '@i18nprune/core';
import { CLI_VERSION } from '@/constants/cli.js';
import { buildReportEnvironmentSnapshot } from '@/commands/report/build.js';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import type { Context } from '@/types/core/context/index.js';
import type { ProjectReportDocument } from '@/types/command/report/index.js';
import { getOrBuildProjectReportWithCache } from './dispatch.js';
import { emitCacheDispatchMessages, emitCacheMemoryHitMessage } from '@i18nprune/core';
import type { OperationId } from '@i18nprune/core';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import type { ProjectReportDataMemo } from '@/types/shared/cache/index.js';

const projectReportDataByContext = new WeakMap<Context, ProjectReportDataMemo>();
const PROJECT_REPORT_CACHE_OP: OperationId = 'report';

function buildProjectReportDocumentFromCtx(ctx: Context): ProjectReportDocument {
  const coreCtx = createCliCoreContext(ctx);
  const { document } = buildReportDocument(coreCtx, {
    environment: buildReportEnvironmentSnapshot(ctx.adapters.fs),
    cwd: process.cwd(),
    toolVersion: CLI_VERSION,
    emit: createCliRunEmitter(ctx.run),
  });
  return document as ProjectReportDocument;
}

export function resolveProjectReportData(ctx: Context): { document: ProjectReportDocument; fromCache: boolean } {
  const memo = projectReportDataByContext.get(ctx);
  if (memo) {
    emitCacheMemoryHitMessage({
      emit: createCliRunEmitter(ctx.run),
      op: PROJECT_REPORT_CACHE_OP,
      label: 'project report',
    });
    return memo;
  }

  const out = getOrBuildProjectReportWithCache(ctx, () => buildProjectReportDocumentFromCtx(ctx));
  emitCacheDispatchMessages({
    emit: createCliRunEmitter(ctx.run),
    op: PROJECT_REPORT_CACHE_OP,
    label: 'project report',
    cache: out.cache,
  });
  for (const warn of out.cache.warnings) {
    ctx.meta.warnings.push(`cache: ${warn.message}`);
  }
  const resolved = { document: out.document, fromCache: out.cache.status === 'hit' };
  projectReportDataByContext.set(ctx, resolved);
  return resolved;
}

/** Rebuild/refresh cached project report after mutating commands write files. */
export function refreshProjectReportCache(ctx: Context): void {
  const out = getOrBuildProjectReportWithCache(ctx, () => buildProjectReportDocumentFromCtx(ctx));
  emitCacheDispatchMessages({
    emit: createCliRunEmitter(ctx.run),
    op: PROJECT_REPORT_CACHE_OP,
    label: 'project report',
    cache: out.cache,
  });
  for (const warn of out.cache.warnings) {
    ctx.meta.warnings.push(`cache: ${warn.message}`);
  }
  projectReportDataByContext.set(ctx, { document: out.document, fromCache: out.cache.status === 'hit' });
}
