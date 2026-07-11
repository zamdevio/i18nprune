/** Per-command help appendix (Examples, Related, group Workflows, footnotes). */
export type CommandHelpExtra = {
  /** Group commands only — short recipe lines (e.g. `kits pr -o pr.md`). */
  workflows?: string[];
  examples?: string[];
  related?: string[];
  /** Dim footnotes after Related (global flags, timing notes). */
  notes?: string[];
};

export type HelpColorizeSection =
  | 'none'
  | 'arguments'
  | 'options'
  | 'commands'
  | 'global-options'
  | 'aliases'
  | 'workflows'
  | 'examples'
  | 'related'
  | 'notes';
