import { emitRunMessage } from '../shared/run/index.js';
import type { CacheDispatchInfo, CacheDispatchReason } from '../types/cache/index.js';
import type { OperationId, RunEmitter } from '../types/shared/run/index.js';

function describeCacheInvalidation(reason: CacheDispatchReason): string | undefined {
  switch (reason) {
    case 'files_changed':
      return 'source files changed';
    case 'files_index_recovered':
      return 'files index rebuilt; analysis reused (project files unchanged)';
    case 'run_binding_stale':
      return 'stale (source files changed since last cache write)';
    case 'run_invalid':
      return 'cached data failed validation';
    case 'run_missing':
      return 'no cached data';
    case 'cache_unavailable':
      return 'cache unavailable';
    case 'no_cache':
      return 'cache disabled';
    case 'cache_hit':
    case 'producer_succeeded':
      return undefined;
    default:
      return undefined;
  }
}

function emitCacheDetail(input: {
  emit?: RunEmitter;
  op: OperationId;
  runId?: string;
  message: string;
}): void {
  emitRunMessage(input.emit, {
    op: input.op,
    runId: input.runId,
    channel: 'cache',
    level: 'detail',
    message: input.message,
  });
}

function emitCacheDeltaFiles(input: {
  emit?: RunEmitter;
  op: OperationId;
  runId?: string;
  kind: 'added' | 'changed' | 'deleted';
  files: readonly string[];
}): void {
  const limit = 12;
  for (const file of input.files.slice(0, limit)) {
    emitCacheDetail({ ...input, message: `    ${input.kind}: ${file}` });
  }
  if (input.files.length > limit) {
    emitCacheDetail({ ...input, message: `    ${input.kind}: ... ${String(input.files.length - limit)} more` });
  }
}

/** Emits `--debug-cache` output: status line, invalidation reason, paths, delta summary, and file samples. */
export function emitCacheDispatchMessages(input: {
  emit?: RunEmitter;
  op: OperationId;
  runId?: string;
  label: string;
  cache: CacheDispatchInfo;
}): void {
  emitRunMessage(input.emit, {
    op: input.op,
    runId: input.runId,
    channel: 'cache',
    level: 'info',
    message: `${input.label} cache ${input.cache.status} (${input.cache.reason})`,
  });
  const invalidation = describeCacheInvalidation(input.cache.reason);
  if (invalidation) {
    emitCacheDetail({ ...input, message: `  invalidated: ${invalidation}` });
  }
  if (input.cache.paths) {
    emitCacheDetail({ ...input, message: `  meta: ${input.cache.paths.meta}` });
    emitCacheDetail({ ...input, message: `  project: ${input.cache.paths.projectDir}` });
    emitCacheDetail({ ...input, message: `  files: ${input.cache.paths.files}` });
    emitCacheDetail({ ...input, message: `  analysis: ${input.cache.paths.analysis}` });
  }
  if (input.cache.delta) {
    const d = input.cache.delta;
    emitCacheDetail({
      ...input,
      message: `  file delta: +${String(d.added.length)} ~${String(d.changed.length)} -${String(d.deleted.length)} =${String(d.unchanged.length)}`,
    });
    emitCacheDeltaFiles({ ...input, kind: 'added', files: d.added });
    emitCacheDeltaFiles({ ...input, kind: 'changed', files: d.changed });
    emitCacheDeltaFiles({ ...input, kind: 'deleted', files: d.deleted });
  }
  if (input.cache.analysisRebuild) {
    const r = input.cache.analysisRebuild;
    if (r.strategy === 'reuse') {
      emitCacheDetail({ ...input, message: '  analysis rebuild: skipped (reusing analysis.json)' });
    } else if (r.strategy === 'partial') {
      const src = r.srcDelta;
      const changed = src?.changed.length ?? 0;
      const added = src?.added.length ?? 0;
      const deleted = src?.deleted.length ?? 0;
      emitCacheDetail({
        ...input,
        message: `  analysis rebuild: partial (${String(changed)} changed, ${String(added)} added, ${String(deleted)} deleted)`,
      });
    } else {
      let detail = 'config rebuild=full';
      if (r.reason === 'src_threshold') {
        const pct = r.trackedSrcCount && r.trackedSrcCount > 0
          ? Math.round(((r.srcAffected ?? 0) / r.trackedSrcCount) * 100)
          : 100;
        detail = `threshold ${String(pct)}% (limit ${String(r.thresholdPercent ?? 40)}%)`;
      } else if (r.reason === 'layout_changed') {
        detail = 'layout changed';
      } else if (r.reason === 'source_locale_changed') {
        detail = 'source locale changed';
      } else if (r.reason === 'locale_or_non_src_changed') {
        detail = 'locale or non-src delta';
      } else if (r.reason === 'no_previous_cache') {
        detail = 'no previous analysis cache';
      } else if (r.reason === 'files_index_missing') {
        detail = 'files.json missing';
      } else if (r.reason === 'files_index_malformed') {
        detail = 'files.json invalid or oversized';
      } else if (r.reason === 'files_index_empty') {
        detail = 'files.json empty';
      } else if (r.reason === 'files_index_stale') {
        detail = 'files index unusable and project files changed since last analysis';
      }
      emitCacheDetail({ ...input, message: `  analysis rebuild: full (${detail})` });
    }
  }
  if (input.cache.filesIndexStatus !== undefined && input.cache.filesIndexStatus.kind !== 'ok') {
    const kind = input.cache.filesIndexStatus.kind;
    const note =
      kind === 'missing'
        ? 'files.json missing — rebuilding fingerprints from disk'
        : kind === 'malformed'
          ? 'files.json invalid or oversized — rebuilding fingerprints from disk'
          : 'files.json empty — rebuilding fingerprints from disk';
    emitCacheDetail({ ...input, message: `  files index: ${note}` });
  }
  for (const warn of input.cache.warnings) {
    const path = warn.path ? ` (${warn.path})` : '';
    emitRunMessage(input.emit, {
      op: input.op,
      runId: input.runId,
      channel: 'cache',
      level: 'info',
      message: `warning: ${warn.message}${path}`,
    });
  }
}

/** Emits a `same_run` memory-hit line for a second dispatch that reuses the first dispatch's result. */
export function emitCacheMemoryHitMessage(input: {
  emit?: RunEmitter;
  op: OperationId;
  runId?: string;
  label: string;
}): void {
  emitRunMessage(input.emit, {
    op: input.op,
    runId: input.runId,
    channel: 'cache',
    level: 'info',
    message: `${input.label} cache memory hit (same_run)`,
  });
}
