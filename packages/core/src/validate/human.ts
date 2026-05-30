import { DEFAULT_LIST_TOP } from '../shared/constants/listDisplay.js';
import type { DynamicKeySite } from '../types/extractor/dynamic/index.js';

export type BuildValidateHumanViewInput = {
  missing: string[];
  dynamicSites: DynamicKeySite[];
  dynamicPreviewLimit?: number;
  missingPreviewLimit?: number;
};

export type ValidateHumanView = {
  dynamicWarning?: string;
  dynamicPreview: string[];
  dynamicHiddenCount: number;
  missingMessage: string;
  missingPreview: string[];
  missingHiddenCount: number;
};

/** Pure human-log view builder for validate command output. */
export function buildValidateHumanView(input: BuildValidateHumanViewInput): ValidateHumanView {
  const missingLimit = input.missingPreviewLimit ?? DEFAULT_LIST_TOP;
  const missingPreview = input.missing.slice(0, missingLimit);
  return {
    dynamicWarning:
      input.dynamicSites.length > 0
        ? `${String(input.dynamicSites.length)} translation call(s) use a non-literal key — not validated as fixed literal paths. Run \`i18nprune locales dynamic\` for file:line samples.`
        : undefined,
    dynamicPreview: [],
    dynamicHiddenCount: 0,
    missingMessage:
      input.missing.length === 0
        ? 'All literal translation keys found in the current code scan exist in the source locale JSON.'
        : `${String(input.missing.length)} key(s) in code missing from source JSON:`,
    missingPreview,
    missingHiddenCount: Math.max(0, input.missing.length - missingPreview.length),
  };
}
