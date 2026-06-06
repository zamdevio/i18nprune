export type PhaseColor = 'teal' | 'gray' | 'purple' | 'coral';

export interface Phase {
  week: string;
  label: string;
  commits: number;
  theme: string;
  color: PhaseColor;
  shipped: string[];
}
