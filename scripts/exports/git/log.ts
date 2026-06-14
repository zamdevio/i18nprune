import { runGit } from './run.js';
import { rootIndexRepoPath } from '../paths.js';

export interface GitCommitRow {
  sha: string;
  date: string;
  subject: string;
}

/** All `v*` tags sorted by version refname. */
export function listVersionTags(limit?: number): string[] {
  const result = runGit(['tag', '-l', 'v*', '--sort=version:refname']);
  if (!result.ok || !result.stdout) return [];
  const tags = result.stdout.split('\n').filter(Boolean);
  if (limit !== undefined && limit > 0) return tags.slice(-limit);
  return tags;
}

/** Commits touching the root barrel within an ISO date window (UTC days). */
export function listBarrelCommits(input: {
  sinceIso: string;
  untilIso: string;
  limit?: number;
}): GitCommitRow[] {
  const args = ['log'];
  if (input.limit !== undefined && input.limit > 0) args.push(`-n${input.limit}`);
  args.push(
    `--since=${input.sinceIso}`,
    `--until=${input.untilIso}`,
    '--format=%H|%cI|%s',
    '--',
    rootIndexRepoPath,
  );
  const result = runGit(args);
  if (!result.ok || !result.stdout) return [];
  return result.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sha, date, ...rest] = line.split('|');
      return { sha: sha!, date: date!, subject: rest.join('|') };
    });
}
