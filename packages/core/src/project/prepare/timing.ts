import type { ProjectPrepareMeta } from '../../types/project/prepare.js';

export type PrepareTimer = {
  mark(label: 'zipParsed' | 'extractionDone'): void;
  finish(prepareHost?: string): ProjectPrepareMeta;
};

/** Wall-clock prepare timer (sub-ms via `performance.now()`). */
export function createPrepareTimer(): PrepareTimer {
  const t0 = performance.now();
  const marks: Partial<Record<'zipParsed' | 'extractionDone', number>> = {};

  return {
    mark(label) {
      marks[label] = performance.now();
    },
    finish(prepareHost) {
      const tEnd = performance.now();
      const zipParsedMs =
        marks.zipParsed !== undefined ? Math.max(0, Math.round(marks.zipParsed - t0)) : undefined;
      const extractionMs =
        marks.zipParsed !== undefined && marks.extractionDone !== undefined
          ? Math.max(0, Math.round(marks.extractionDone - marks.zipParsed))
          : undefined;
      const totalMs = Math.max(0, Math.round(tEnd - t0));
      return {
        ...(prepareHost ? { prepareHost } : {}),
        ...(zipParsedMs !== undefined ? { zipParsedMs } : {}),
        ...(extractionMs !== undefined ? { extractionMs } : {}),
        totalMs,
      };
    },
  };
}
