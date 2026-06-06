import fs from 'node:fs';
import path from 'node:path';
import { tryGit } from './git.js';
import { REPO_ROOT } from './paths.js';
import type { ExportCommit } from './parse.js';
import { resolveGitHubRepoUrl } from './github.js';

export interface SummaryOutput {
  totalCommits: number;
  activeDays: number;
  calendarDays: number;
  authors: number;
  tsFiles: number;
  tsSourceLines: number;
  mdLines: number;
  netLinesAdded: number;
  firstCommit: string;
  lastCommit: string;
  tags: string[];
  branches: string[];
  topCommitDay: { date: string; count: number };
  syncedAt: string;
  githubRepoUrl: string | null;
}

function countTrackedLines(globs: string[]): number {
  const files = tryGit(['ls-files', ...globs])?.split('\n').filter(Boolean) ?? [];
  let total = 0;
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(REPO_ROOT, file), 'utf-8');
      total += content.split('\n').length;
    } catch {
      /* missing on disk */
    }
  }
  return total;
}

export function buildSummary(commits: ExportCommit[]): SummaryOutput {
  const dates = commits.map((c) => c.date);
  const firstCommit = dates.at(-1) ?? '';
  const lastCommit = dates[0] ?? '';

  const dayCounts = new Map<string, number>();
  for (const commit of commits) {
    dayCounts.set(commit.date, (dayCounts.get(commit.date) ?? 0) + 1);
  }

  let topDate = '';
  let topCount = 0;
  for (const [date, count] of dayCounts) {
    if (count > topCount) {
      topDate = date;
      topCount = count;
    }
  }

  const calendarDays =
    firstCommit && lastCommit ?
      Math.max(
        1,
        Math.round(
          (new Date(`${lastCommit}T12:00:00Z`).getTime() -
            new Date(`${firstCommit}T12:00:00Z`).getTime()) /
            86400000,
        ) + 1,
      )
    : 0;

  const authors = new Set(commits.map((c) => c.email || c.author)).size;
  const netLinesAdded = commits.reduce((sum, c) => sum + c.insertions - c.deletions, 0);

  const tags =
    tryGit(['tag', '--list', 'v*'])?.split('\n').filter(Boolean).sort() ?? [];

  const branches =
    tryGit(['branch', '--list', '--format=%(refname:short)'])
      ?.split('\n')
      .filter(Boolean)
      .sort() ?? [];

  return {
    totalCommits: commits.length,
    activeDays: dayCounts.size,
    calendarDays,
    authors,
    tsFiles: tryGit(['ls-files', '*.ts', '*.tsx'])?.split('\n').filter(Boolean).length ?? 0,
    tsSourceLines: countTrackedLines(['*.ts', '*.tsx']),
    mdLines: countTrackedLines(['*.md']),
    netLinesAdded,
    firstCommit,
    lastCommit,
    tags,
    branches,
    topCommitDay: { date: topDate, count: topCount },
    syncedAt: new Date().toISOString(),
    githubRepoUrl: resolveGitHubRepoUrl(),
  };
}

export function verifyGitRepo(): void {
  const ok = tryGit(['rev-parse', '--is-inside-work-tree']);
  if (ok !== 'true') {
    throw new Error('sync requires a git repository (run from monorepo root)');
  }
}
