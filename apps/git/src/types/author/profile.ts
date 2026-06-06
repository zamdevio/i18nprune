import type { ScopeBreakdownItem, TypeBreakdownItem } from '../chart';
import type { Commit } from '../commit';

export interface AuthorPeakDay {
  date: string;
  count: number;
}

export interface AuthorTopScope {
  scope: string;
  count: number;
}

export interface AuthorProfileStats {
  activeDays: number;
  weeksActive: number;
  netLines: number;
  avgCommitsPerActiveDay: number;
  peakCommitDay: AuthorPeakDay | null;
  topScope: AuthorTopScope | null;
  typeBreakdown: TypeBreakdownItem[];
  scopeBreakdown: ScopeBreakdownItem[];
  topScopes: ScopeBreakdownItem[];
  recentCommits: Commit[];
}
