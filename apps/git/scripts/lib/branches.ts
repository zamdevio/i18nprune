import type { ExportCommit } from './parse.js';
import { tryGit } from './git.js';

export interface BranchOutput {
  name: string;
  hash: string;
  shortHash: string;
  date: string;
  subject: string;
  isCurrent: boolean;
  totalCommits: number;
  authors: number;
  authorEmails: string[];
  insertions: number;
  deletions: number;
  netLines: number;
  activeDays: number;
  firstCommit: string;
  lastCommit: string;
}

function branchRef(name: string): string {
  return `refs/heads/${name}`;
}

function revListHashes(branchName: string): string[] {
  return tryGit(['rev-list', branchRef(branchName)])?.split('\n').filter(Boolean) ?? [];
}

function distanceToTip(commitHash: string, branchName: string): number | null {
  const raw = tryGit(['rev-list', '--count', `${commitHash}..${branchRef(branchName)}`]);
  if (raw === null) return null;
  const distance = Number.parseInt(raw, 10);
  return Number.isNaN(distance) ? null : distance;
}

/** Branch whose tip is closest to the commit — avoids tagging every commit with new feature branches. */
export function pickPrimaryBranch(commitHash: string, containing: string[]): string | null {
  if (containing.length === 0) return null;
  if (containing.length === 1) return containing[0];

  let best = containing[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const name of containing) {
    const distance = distanceToTip(commitHash, name);
    if (distance === null) continue;

    const isBetter =
      distance < bestDistance ||
      (distance === bestDistance && name === 'main' && best !== 'main');

    if (isBetter) {
      bestDistance = distance;
      best = name;
    }
  }

  return best;
}

export function buildCommitBranchMap(branchNames: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const name of branchNames) {
    for (const hash of revListHashes(name)) {
      const existing = map.get(hash) ?? [];
      if (!existing.includes(name)) existing.push(name);
      map.set(hash, existing);
    }
  }

  for (const [hash, names] of map) {
    map.set(
      hash,
      [...names].sort((left, right) => left.localeCompare(right)),
    );
  }

  return map;
}

export function buildBranches(
  commits: Array<ExportCommit & { branch: string | null }>,
): BranchOutput[] {
  const commitByHash = new Map(commits.map((commit) => [commit.fullHash, commit]));
  const names =
    tryGit(['branch', '--list', '--format=%(refname:short)'])?.split('\n').filter(Boolean) ?? [];
  const current = tryGit(['branch', '--show-current']) ?? '';

  return names
    .map((name) => {
      const hash = tryGit(['rev-parse', branchRef(name)]) ?? '';
      const shortHash = hash.slice(0, 7);
      const logLine = hash ? tryGit(['log', '-1', '--format=%ad\x1e%s', '--date=short', hash]) : null;
      const [date = '', subject = ''] = logLine?.split('\x1e') ?? [];

      // Primary-branch ownership — same rule as /commits?branch= and commit.branch
      const branchCommits = commits.filter((commit) => commit.branch === name);

      const authorEmails = [...new Set(branchCommits.map((commit) => commit.email))].sort();
      const insertions = branchCommits.reduce((sum, commit) => sum + commit.insertions, 0);
      const deletions = branchCommits.reduce((sum, commit) => sum + commit.deletions, 0);
      const dates = branchCommits.map((commit) => commit.date).sort();
      const activeDays = new Set(branchCommits.map((commit) => commit.date)).size;

      const tipCommit = commitByHash.get(hash);

      return {
        name,
        hash,
        shortHash,
        date,
        subject: tipCommit?.subject ?? subject,
        isCurrent: name === current,
        totalCommits: branchCommits.length,
        authors: authorEmails.length,
        authorEmails,
        insertions,
        deletions,
        netLines: insertions - deletions,
        activeDays,
        firstCommit: dates[0] ?? '',
        lastCommit: dates.at(-1) ?? '',
      };
    })
    .sort((left, right) => {
      if (left.isCurrent !== right.isCurrent) return left.isCurrent ? -1 : 1;
      return right.date.localeCompare(left.date) || left.name.localeCompare(right.name);
    });
}
