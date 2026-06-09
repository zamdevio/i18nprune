import { DEFAULT_LIST_TOP } from '../shared/constants/listDisplay.js';
import { splitDynamicSiteCounts } from '../extractor/dynamic/groups.js';
import type { DynamicKeySite } from '../types/extractor/dynamic/index.js';

export type BuildValidateHumanViewInput = {
  missing: string[];
  dynamicSites: DynamicKeySite[];
  dynamicPreviewLimit?: number;
  missingPreviewLimit?: number;
};

export type ValidateHumanView = {
  dynamicWarning?: string;
  dynamicCommentedNote?: string;
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
  const split = splitDynamicSiteCounts(input.dynamicSites);
  return {
    dynamicWarning:
      split.active > 0
        ? `${String(split.active)} translation call(s) use a non-literal key — not validated as fixed literal paths. Run \`i18nprune locales dynamic\` for file:line samples.`
        : undefined,
    dynamicCommentedNote:
      split.commented > 0
        ? `(+ ${String(split.commented)} commented call site(s) omitted from runtime scan — use \`i18nprune locales dynamic --full\`)`
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
