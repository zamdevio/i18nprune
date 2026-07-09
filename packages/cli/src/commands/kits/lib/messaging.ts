import { getDocsUrl } from '@i18nprune/core';
import { style } from '@/utils/style/index.js';

/** Human-only honesty note — dynamic sites ≠ complete literal locale coverage. */
export function dynamicKeyHonestyLines(): string[] {
  const doc = getDocsUrl('issues/validate#dynamic-key-sites');
  return [
    '',
    style.dim(
      'Note: dynamic key sites are excluded from literal missing-key checks. validate ok does not mean every dynamic suffix has translatable strings — use copyPrefixes for cleanup safety.',
    ),
    style.dim(`Docs: ${doc}`),
  ];
}
