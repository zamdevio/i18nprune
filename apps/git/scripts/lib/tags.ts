import type { ExportCommit } from './parse.js';
import { pickPrimaryBranch } from './branches.js';
import { tryGit } from './git.js';

export interface TagOutput {
  name: string;
  hash: string;
  shortHash: string;
  date: string;
  subject: string;
}

export function buildTags(): TagOutput[] {
  const names = tryGit(['tag', '--list', 'v*'])?.split('\n').filter(Boolean).sort() ?? [];

  return names.map((name) => {
    const hash = tryGit(['rev-list', '-n', '1', name]) ?? '';
    const shortHash = hash.slice(0, 7);
    const logLine = hash ? tryGit(['log', '-1', '--format=%ad\x1e%s', '--date=short', hash]) : null;
    const [date = '', subject = ''] = logLine?.split('\x1e') ?? [];

    return { name, hash, shortHash, date, subject };
  });
}

export function buildCommitTagMap(tags: TagOutput[]): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const tag of tags) {
    const existing = map.get(tag.hash) ?? [];
    existing.push(tag.name);
    map.set(tag.hash, existing.sort());
  }

  return map;
}

export function annotateCommitRefs(
  commits: ExportCommit[],
  tagMap: Map<string, string[]>,
  branchMap: Map<string, string[]>,
): Array<ExportCommit & { tags: string[]; branches: string[]; branch: string | null }> {
  return commits.map((commit) => {
    const branches = branchMap.get(commit.fullHash) ?? [];
    return {
      ...commit,
      tags: tagMap.get(commit.fullHash) ?? [],
      branches,
      branch: pickPrimaryBranch(commit.fullHash, branches),
    };
  });
}
