import type { PrepareTimer, PrepareTimerMark } from '../../types/project/prepareTimer.js';

/** Wall-clock prepare timer (sub-ms via `performance.now()`). */
export function createPrepareTimer(): PrepareTimer {
  const t0 = performance.now();
  const marks: Partial<Record<PrepareTimerMark, number>> = {};

  return {
    mark(label) {
      marks[label] = performance.now();
    },
    finish(prepareHost) {
      const tEnd = performance.now();
      const zipParsedMs =
        marks.zipParsed !== undefined ? Math.max(0, Math.round(marks.zipParsed - t0)) : undefined;
      const analysisMs =
        marks.zipParsed !== undefined && marks.analysisDone !== undefined
          ? Math.max(0, Math.round(marks.analysisDone - marks.zipParsed))
          : undefined;
      const extractionMs =
        marks.analysisDone !== undefined && marks.extractionDone !== undefined
          ? Math.max(0, Math.round(marks.extractionDone - marks.analysisDone))
          : marks.zipParsed !== undefined && marks.extractionDone !== undefined
            ? Math.max(0, Math.round(marks.extractionDone - marks.zipParsed))
            : undefined;
      const totalMs = Math.max(0, Math.round(tEnd - t0));
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
