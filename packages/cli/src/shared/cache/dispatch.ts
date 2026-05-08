import { listSourceFiles } from '@i18nprune/core';
import { readRuntimeFsTextSync } from '@i18nprune/core/runtime/helpers/sync';
import { projectReportDocumentSchema } from '@i18nprune/report';
import { computeContentHash } from './hash.js';
import { diffProjectFiles } from './engine.js';
import { loadProjectFilesState, loadProjectRunState, saveProjectFilesState, saveProjectRunState } from './state.js';
import { prepareCacheForRun } from './maintenance.js';
import type {
  CacheDispatchReason,
  CacheDispatchStatus,
  CacheProjectFileRecord,
  CliCacheWarning,
} from '@/types/shared/cache/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { ProjectReportDocument } from '@/types/command/report/index.js';

function buildCurrentFileRecords(ctx: Context): Record<string, CacheProjectFileRecord> {
  const files = listSourceFiles({ fs: ctx.adapters.fs, path: ctx.adapters.path }, ctx.paths.srcRoot, ctx.config.exclude);
  const all = [ctx.paths.sourceLocale, ...files];
  const now = new Date().toISOString();
  const out: Record<string, CacheProjectFileRecord> = {};
  for (const absPath of all) {
    const content = readRuntimeFsTextSync(absPath, ctx.adapters.fs);
    const rel = ctx.adapters.path.relative(ctx.paths.srcRoot, absPath).replace(/\\/g, '/');
    const key = absPath === ctx.paths.sourceLocale ? '__source_locale__' : rel;
    out[key] = {
      hash: computeContentHash(content),
      size: Buffer.byteLength(content, 'utf8'),
      mtimeMs: 0,
      updatedAt: now,
    };
  }
  return out;
}

type ReportCacheResult = {
  document: ProjectReportDocument;
  cache: { status: CacheDispatchStatus; reason: CacheDispatchReason; warnings: CliCacheWarning[] };
};

export function getOrBuildProjectReportWithCache(
  ctx: Context,
  producer: () => ProjectReportDocument,
): ReportCacheResult {
  const warnings: CliCacheWarning[] = [];
  const state = ctx.meta.cache;
  if (!state.enabled) {
    return {
      document: producer(),
      cache: { status: state.reason === 'cli_no_cache' ? 'bypass' : 'disabled', reason: 'no_cache', warnings },
    };
  }

  const prepared = prepareCacheForRun(state);
  warnings.push(...prepared.warnings);

  const currentFiles = buildCurrentFileRecords(ctx);
  const prevFiles = loadProjectFilesState(state);
  warnings.push(...prevFiles.warnings);
  const delta = diffProjectFiles(prevFiles.files.files, currentFiles);
  const hasFileChanges = delta.added.length + delta.changed.length + delta.deleted.length > 0;

  const prevRun = loadProjectRunState(state);
  warnings.push(...prevRun.warnings);
  if (!hasFileChanges && prevRun.run?.data !== undefined) {
    const parsed = projectReportDocumentSchema.safeParse(prevRun.run.data);
    if (parsed.success) {
      return { document: parsed.data, cache: { status: 'hit', reason: 'cache_hit', warnings } };
    }
  }

  const fresh = producer();
  const saveFilesWarn = saveProjectFilesState(state, { ...prevFiles.files, files: currentFiles });
  if (saveFilesWarn) warnings.push(saveFilesWarn);
  const saveRunWarn = saveProjectRunState(state, { data: fresh });
  if (saveRunWarn) warnings.push(saveRunWarn);

  return {
    document: fresh,
    cache: { status: 'miss', reason: hasFileChanges ? 'files_changed' : 'producer_succeeded', warnings },
  };
}
