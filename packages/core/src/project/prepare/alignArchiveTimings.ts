import type { ProjectPrepareMeta } from '../../types/project/prepare/index.js';
import type { ProjectSnapshot } from '../../types/project/upload.js';

function finiteMs(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value);
}

/**
 * Maps archive prepare wall-clock ms onto snapshot ISO fields (`preparedAt`, extraction) on edge
 * (Workers `performance.now()` can round sub-ms work to zero; prepare ms are authoritative).
 */
export function alignArchiveSnapshotTimings(input: {
  snapshot: ProjectSnapshot;
  requestReceivedAt?: string;
  prepareMeta: ProjectPrepareMeta;
}): void {
  const baseRaw = input.requestReceivedAt ?? input.snapshot.requestReceivedAt;
  const base =
    typeof baseRaw === 'string' && baseRaw.trim().length > 0 ? Date.parse(baseRaw) : Number.NaN;
  if (!Number.isFinite(base)) return;

  const zipParsedMs = finiteMs(input.prepareMeta.zipParsedMs) ?? 0;
  const totalMs = finiteMs(input.prepareMeta.totalMs);
  let extractionMs = finiteMs(input.prepareMeta.extractionMs);
  if ((extractionMs === undefined || extractionMs === 0) && totalMs !== undefined && totalMs > zipParsedMs) {
    extractionMs = totalMs - zipParsedMs;
  }

  const preparedAtMs = base + zipParsedMs;
  input.snapshot.requestReceivedAt = new Date(base).toISOString();
  input.snapshot.preparedAt = new Date(preparedAtMs).toISOString();

  const extraction = input.snapshot.extraction;
  if (!extraction) return;

  const extractionStartMs = preparedAtMs;
  const extractionEndMs =
    extractionMs !== undefined
      ? preparedAtMs + extractionMs
      : totalMs !== undefined
        ? base + totalMs
        : preparedAtMs + Math.max(1, extractionMs ?? 0);

  extraction.extractionStartedAt = new Date(extractionStartMs).toISOString();
  extraction.computedAt = new Date(Math.max(extractionEndMs, extractionStartMs + 1)).toISOString();
}
