import type { Context } from '@/types/core/context/index.js';
import type { EffectiveReferenceConfig } from '@i18nprune/core/config';
import type { KeyReferenceContext } from '@i18nprune/core';
import { buildKeyReferenceContext as buildKeyReferenceContextCore } from '@i18nprune/core';
import { toExtractorScanInput } from '@/shared/extractor/scanInput.js';

/**
 * Build proven key set and uncertain prefixes for cleanup / sync / generate decisions.
 */
export function buildKeyReferenceContext(
  ctx: Context,
  eff: EffectiveReferenceConfig,
): KeyReferenceContext {
  return buildKeyReferenceContextCore(toExtractorScanInput(ctx), eff);
}
