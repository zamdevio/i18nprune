import type { DynamicKeySite } from '../extractor/dynamic/index.js';
import type { KeyObservation } from '../extractor/keySites/index.js';
import type { Issue } from '../json/envelope/index.js';
import type { RunEmitter } from '../shared/run/index.js';
import type { LocaleSuggestion } from '../suggestions/index.js';

/** JSON `data` for `validate` (same fields as CLI `ValidateJsonOutput` / {@link ValidateScanPayload}). */
export type ValidateJsonPayload = {
  missing: string[];
  count: number;
  dynamic: { count: number };
  keyObservations: { count: number };
  /** Cross-op next-step hints (additive). */
  suggestions?: LocaleSuggestion[];
};

export type ValidateRunOptions = Record<string, never>;

export type ValidateHostHooks = {
  emit?: RunEmitter;
  runId?: string;
};

export type ValidateRunResult = {
  payload: ValidateJsonPayload;
  issues: Issue[];
  fullDynamicSites: DynamicKeySite[];
  fullKeyObservations: KeyObservation[];
};
