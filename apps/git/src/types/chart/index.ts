import type { CommitType } from '../commit';
import type { PhaseColor } from '../phase';

export interface TypeBreakdownItem {
  type: CommitType | 'ci/build';
  count: number;
}

export interface ScopeBreakdownItem {
  scope: string;
  count: number;
}

export interface WeeklyCommitItem {
  week: string;
  label: string;
  count: number;
  color: PhaseColor;
  theme: string;
}

export interface DayHeatmapItem {
  date: string;
  count: number;
}
