import type { Commit, CommitType } from '../types/commit';
import type { ScopeBreakdownItem, TypeBreakdownItem } from '../types/chart';

const TYPE_ORDER: Array<CommitType | 'ci/build'> = [
  'feat',
  'chore',
  'docs',
  'refactor',
  'fix',
  'test',
  'ci/build',
];

const SCOPE_BUCKETS: Record<string, string> = {
  web: 'web/worker',
  worker: 'web/worker',
  ui: 'ui/landing',
  landing: 'ui/landing',
  share: 'share/report',
  report: 'share/report',
  docs: 'docs/ci/tree',
  ci: 'docs/ci/tree',
  tree: 'docs/ci/tree',
};

const SCOPE_ORDER = [
  'core',
  'cli',
  'maintainer',
  'web/worker',
  'ui/landing',
  'share/report',
  'docs/ci/tree',
];

function scopeBucket(scope: string): string {
  return SCOPE_BUCKETS[scope] ?? scope;
}

export function computeTypeBreakdown(commits: Commit[]): TypeBreakdownItem[] {
  const counts = new Map<CommitType | 'ci/build', number>();
  for (const commit of commits) {
    const key: CommitType | 'ci/build' = commit.type === 'ci' ? 'ci/build' : commit.type;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return TYPE_ORDER.filter((type) => (counts.get(type) ?? 0) > 0).map((type) => ({
    type,
    count: counts.get(type) ?? 0,
  }));
}

export function computeScopeBreakdown(commits: Commit[]): ScopeBreakdownItem[] {
  const counts = new Map<string, number>();
  for (const commit of commits) {
    const bucket = scopeBucket(commit.scope);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  const ordered = SCOPE_ORDER.filter((scope) => counts.has(scope)).map((scope) => ({
    scope,
    count: counts.get(scope) ?? 0,
  }));

  const extras = [...counts.keys()]
    .filter((scope) => !SCOPE_ORDER.includes(scope))
    .sort()
    .map((scope) => ({ scope, count: counts.get(scope) ?? 0 }));

  return [...ordered, ...extras];
}
