import type { PrepareTimer, PrepareTimerMark } from '../../types/project/prepare/index.js';

function monotonicMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function roundMs(delta: number): number {
  return Math.max(0, Math.round(delta));
}

function positiveMs(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return undefined;
  return Math.round(value);
}

/** Wall-clock prepare timer (perf deltas + `Date.now()` fallback for Workers). */
export function createPrepareTimer(): PrepareTimer {
  const t0 = monotonicMs();
  const wall0 = Date.now();
  const marks: Partial<Record<PrepareTimerMark, number>> = {};

  return {
    mark(label) {
      marks[label] = monotonicMs();
    },
    finish(prepareHost) {
      const tEnd = monotonicMs();
      const wallTotalMs = Math.max(0, Date.now() - wall0);

      let zipParsedMs =
        marks.zipParsed !== undefined ? roundMs(marks.zipParsed - t0) : undefined;
      const analysisMs =
        marks.zipParsed !== undefined && marks.analysisDone !== undefined
          ? roundMs(marks.analysisDone - marks.zipParsed)
          : undefined;
      let extractionMs =
        marks.analysisDone !== undefined && marks.extractionDone !== undefined
          ? roundMs(marks.extractionDone - marks.analysisDone)
          : marks.zipParsed !== undefined && marks.extractionDone !== undefined
            ? roundMs(marks.extractionDone - marks.zipParsed)
            : undefined;

      let totalMs = Math.max(roundMs(tEnd - t0), wallTotalMs);
      if (totalMs > 0) {
        zipParsedMs = positiveMs(zipParsedMs) ?? (marks.zipParsed !== undefined ? totalMs : undefined);
        if (extractionMs === undefined || extractionMs === 0) {
          extractionMs = Math.max(0, totalMs - (zipParsedMs ?? 0));
        }
      }

      return {
        ...(prepareHost ? { prepareHost } : {}),
        ...(zipParsedMs !== undefined ? { zipParsedMs } : {}),
        ...(analysisMs !== undefined ? { analysisMs } : {}),
        ...(extractionMs !== undefined ? { extractionMs } : {}),
        totalMs,
      };
    },
  };
}
