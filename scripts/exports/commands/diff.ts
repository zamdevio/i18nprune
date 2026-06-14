import { getSnapshot } from '../cache/index.js';
import { diffSnapshots } from '../format/index.js';
import { parseDiffRange } from '../git/index.js';
import { printCommandLine, printDiffReport, printDiffVerbose, printDiffCacheDetail } from '../logger/index.js';

export interface DiffCliOptions {
  range?: string;
  noCache?: boolean;
  force?: boolean;
  verbose?: boolean;
}

export function runExportsDiff(options: DiffCliOptions): void {
  const t0 = performance.now();
  const { left, right, rangeLabel } = parseDiffRange(options.range);
  const cacheOpts = { noCache: options.noCache, force: options.force };

  const leftResult = getSnapshot(left, cacheOpts);
  const rightResult = getSnapshot(right, cacheOpts);
  const diff = diffSnapshots(leftResult.snapshot, rightResult.snapshot);

  printCommandLine('diff', 'ok', Math.round(performance.now() - t0));
  printDiffReport({
    rangeLabel,
    left: leftResult,
    right: rightResult,
    diff,
  });

  if (options.verbose) {
    printDiffVerbose({
      diff,
      left: leftResult.snapshot,
      right: rightResult.snapshot,
    });
    printDiffCacheDetail({ left: leftResult, right: rightResult });
  }
}
