/** Stable suggestion kinds for cross-op locale next-step hints. */
export type LocaleSuggestionKind =
  | 'run_cleanup_source'
  | 'run_cleanup_target'
  | 'run_missing'
  | 'run_validate'
  | 'run_sync'
  | 'run_generate'
  | 'run_locales_dynamic';

/** Core-owned locale suggestion — emitted as human tips and attached to `--json` payloads. */
export type LocaleSuggestion = {
  kind: LocaleSuggestionKind;
  /** Stable id for tests / JSON (e.g. `suggest.cleanup.source_unused`). */
  id: string;
  /** Human one-liner (no ANSI). */
  message: string;
  /** Copy-paste CLI command(s), layout-aware paths filled in when applicable. */
  commands: string[];
  /** Optional structured context for JSON consumers. */
  data?: {
    localeCode?: string;
    segmentPaths?: string[];
    unusedCount?: number;
    missingCount?: number;
  };
};
