import type { CommitType } from '../commit';
import type { PhaseColor } from '../phase';

export const PHASE_COLORS: Record<PhaseColor, string> = {
  teal: '#1D9E75',
  purple: '#534AB7',
  coral: '#D85A30',
  gray: '#888780',
};

export const TYPE_COLORS: Record<CommitType, string> = {
  feat: '#1D9E75',
  chore: '#888780',
  docs: '#378ADD',
  refactor: '#534AB7',
  fix: '#D85A30',
  test: '#BA7517',
  ci: '#3B6D11',
};
