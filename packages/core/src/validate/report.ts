import type { DynamicKeySite } from '../types/extractor/dynamic/index.js';
import type { KeyObservation } from '../types/extractor/keySites/index.js';

export type BuildValidateReportViewInput = {
  missing: string[];
  dynamicSites: DynamicKeySite[];
  keyObservations: KeyObservation[];
  listLimit: number;
};

export type ValidateReportView = {
  missingMessage: string;
  dynamicMessage?: string;
  keyObservationsMessage: string;
  missingPreview: string[];
  dynamicPreview: DynamicKeySite[];
  keyObservationsPreview: KeyObservation[];
};

/** Pure report-view shaper for validate command summaries/previews. */
export function buildValidateReportView(input: BuildValidateReportViewInput): ValidateReportView {
  return {
    missingMessage:
      input.missing.length > 0
        ? `${String(input.missing.length)} key(s) in code missing from source JSON`
        : 'All scanned literal keys exist in source JSON.',
    dynamicMessage:
      input.dynamicSites.length > 0
        ? `${String(input.dynamicSites.length)} non-literal translation call site(s) found`
        : undefined,
    keyObservationsMessage: `${String(input.keyObservations.length)} key observation(s) extracted`,
    missingPreview: input.missing.slice(0, input.listLimit),
    dynamicPreview: input.dynamicSites.slice(0, input.listLimit),
    keyObservationsPreview: input.keyObservations.slice(0, input.listLimit),
  };
}
