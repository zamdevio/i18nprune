import { emitRunMessage } from '../shared/run/index.js';
import type { CacheDispatchInfo, CacheDispatchReason } from '../types/cache/index.js';
import type { OperationId, RunEmitter } from '../types/shared/run/index.js';

function describeCacheInvalidation(reason: CacheDispatchReason): string | undefined {
  switch (reason) {
    case 'files_changed':
      return 'input file fingerprints changed';
    case 'run_invalid':
      return 'cached payload failed schema validation';
    case 'run_missing':
      return 'cached payload is missing';
    case 'cache_unavailable':
      return 'cache unavailable for this run';
    case 'no_cache':
      return 'cache disabled for this run';
    case 'cache_hit':
    case 'producer_succeeded':
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
    emitCacheDetail({ ...input, message: `  run: ${input.cache.paths.run}` });
  }
  if (input.cache.delta) {
    emitCacheDetail({
      ...input,
      message: `  file delta: +${String(input.cache.delta.added.length)} ~${String(input.cache.delta.changed.length)} -${String(input.cache.delta.deleted.length)} =${String(input.cache.delta.unchanged.length)}`,
    });
    emitCacheDeltaFiles({ ...input, kind: 'added', files: input.cache.delta.added });
    emitCacheDeltaFiles({ ...input, kind: 'changed', files: input.cache.delta.changed });
    emitCacheDeltaFiles({ ...input, kind: 'deleted', files: input.cache.delta.deleted });
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
