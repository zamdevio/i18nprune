import { getSnapshot, trendRollupFromSnapshot } from '../cache/index.js';
import { listVersionTags, resolveSourceRef } from '../git/index.js';
import { printCommandLine, printTrendReport } from '../logger/index.js';

export interface TrendCliOptions {
  tagLimit?: number;
  noCache?: boolean;
  force?: boolean;
  verbose?: boolean;
}

export function runExportsTrend(options: TrendCliOptions = {}): void {
  const t0 = performance.now();
  const tags = listVersionTags(options.tagLimit ?? 12);
  if (!tags.length) {
    printCommandLine('trend', 'ok', Math.round(performance.now() - t0));
    printTrendReport({ rows: [], tagLimit: options.tagLimit ?? 12, verbose: options.verbose });
    return;
  }

  const rows = tags.map((tag) => {
    const ref = resolveSourceRef(tag);
    const { snapshot, cache } = getSnapshot(ref, { noCache: options.noCache, force: options.force });
    return {
      tag,
      sha: ref.kind === 'commit' ? ref.sha : snapshot.sha,
      cache,
      rollup: trendRollupFromSnapshot(snapshot),
    };
  });

  printCommandLine('trend', 'ok', Math.round(performance.now() - t0));
  printTrendReport({ rows, tagLimit: options.tagLimit ?? 12, verbose: options.verbose });
}
