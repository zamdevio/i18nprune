/**
 * Dynamic (non-literal) translation call sites — shared by validate and `locales dynamic`.
 * Optional fields are omitted when analysis used merged source text (no per-file path).
 */
export type DynamicKeySiteKind =
  | 'non_literal'
  | 'template_interpolation'
  | 'empty_call'
  /** First argument appears inside a line or block comment (inactive for runtime). */
  | 'commented';

export type { ScanProjectDynamicKeySitesInput } from './orchestrate.js';

export type DynamicKeySite = {
  kind: DynamicKeySiteKind;
  /** Function name as configured (e.g. `t`). */
  functionName: string;
  /** Short excerpt for logs / JSON (single line). */
  preview: string;
  /**
   * Absolute or project-relative path when scanned per file; omitted for merged-text analysis.
   */
  filePath?: string;
  /** 1-based line when `filePath` is set. */
  line?: number;
  /** 1-based column (UTF-16 code unit) at call start when `filePath` is set. */
  column?: number;
  /** True when the matched translation call spans multiple lines. */
  isMultilineCall?: boolean;
  /** True when the call site offset lies inside a line or block comment (TS/JS heuristic). */
  isCommented?: boolean;
  /**
   * True when the file extension is one we treat as executable source for dynamic-key analysis.
   * Non-source extensions are not scanned; this is only set when a provider handled the file.
   */
  isSourceFile?: boolean;
  /**
   * For **`template_interpolation`**: static key prefix up to (but not including) the first
   * `${…}` that cannot be resolved from the const map.
   */
  resolvedPrefix?: string;
};

