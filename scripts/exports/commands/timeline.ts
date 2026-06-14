import chalk from 'chalk';
import { ExportError } from '../errors/index.js';
import { getSnapshot, trendRollupFromSnapshot } from '../cache/index.js';
import { formatGitRunStats, listBarrelCommits, resetGitRunStats, shortSha } from '../git/index.js';
import { printCommandLine, printTimelineReport } from '../logger/index.js';
import { formatTimelineRangeHelp, parseTimelineRange } from '../time/index.js';
import type { CacheStatus } from '../cache/index.js';

export interface TimelineCliOptions {
  range?: string;
  /** `0` means no limit; omitted defaults to 20. */
  limit?: number;
  noCache?: boolean;
  force?: boolean;
  verbose?: boolean;
}

export function runExportsTimeline(options: TimelineCliOptions = {}): void {
  resetGitRunStats();
  const t0 = performance.now();
  const rangeToken = options.range ?? '@4w';
  const limit = options.limit ?? 20;
  const range = parseTimelineRange(rangeToken);
  if (!range) {
    throw new ExportError(`Invalid timeline range "${rangeToken}"`, 'invalid_range', {
      details: {
        range: rangeToken,
        suggestion: formatTimelineRangeHelp().join('; '),
      },
    });
  }

  const commits = listBarrelCommits({
    sinceIso: range.sinceIso,
    untilIso: range.untilIso,
    limit,
  });

  const warmer = new TimelineWarmer(commits.length, Boolean(options.verbose));
  const rows = commits.map((commit) => {
    const warmT0 = performance.now();
    const { snapshot, cache } = getSnapshot(
      { kind: 'commit', sha: commit.sha, label: shortSha(commit.sha) },
      {
        noCache: options.noCache,
        force: options.force,
        profile: 'timeline',
        git: { commitDate: commit.date },
      },
    );
    warmer.tick(commit.sha, Math.round(performance.now() - warmT0), cache);
    return {
      date: commit.date.slice(0, 10),
      sha: commit.sha,
      subject: commit.subject,
      cache,
      rollup: trendRollupFromSnapshot(snapshot),
      delta: null as number | null,
    };
  });

  const warmStats = warmer.finish();

  for (let i = 0; i < rows.length; i++) {
    if (i === 0) continue;
    rows[i]!.delta = rows[i]!.rollup.rootFlat - rows[i - 1]!.rollup.rootFlat;
  }

  printCommandLine('timeline', 'ok', Math.round(performance.now() - t0));
  printTimelineReport({
    range,
    limit,
    rows,
    verbose: options.verbose,
    warmStats,
    gitStats: formatGitRunStats(),
  });
}

export class TimelineWarmer {
  private warmed = 0;
  private totalMs = 0;

  constructor(
    private readonly total: number,
    private readonly verbose: boolean,
  ) {}

  tick(sha: string, ms: number, cache: CacheStatus): void {
    this.warmed += 1;
    this.totalMs += ms;
    if (this.verbose) {
      console.error(
        chalk.dim(
          `exports  timeline · warm ${this.warmed}/${this.total} · ${shortSha(sha)} · ${cache} · ${ms}ms`,
        ),
      );
      return;
    }
    process.stderr.write(
      `\r\x1b[Kexports  timeline · warming ${this.warmed}/${this.total} · ${this.totalMs}ms …`,
    );
  }

  finish(): { warmed: number; totalMs: number } {
    if (this.verbose) {
      console.error(
        chalk.dim(`exports  timeline · warmed ${this.warmed}/${this.total} · ${this.totalMs}ms total`),
      );
    } else if (this.total > 0) {
    process.stderr.write(
      `\r\x1b[Kexports  timeline · warmed ${this.warmed}/${this.total} · ${this.totalMs}ms\n`,
    );
    }
    return { warmed: this.warmed, totalMs: this.totalMs };
  }
}
