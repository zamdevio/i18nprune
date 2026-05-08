import type { Context } from '@/types/core/context/index.js';
import type { EffectiveReferenceConfig } from '@i18nprune/core/config';
import type { KeyReferenceContext } from '@/types/core/reference/context.js';
import { buildKeyReferenceContext as buildKeyReferenceContextCore } from '@i18nprune/core';
import { toExtractorScanInput } from '@/shared/extractor/scanInput.js';

/**
 * Build proven key set and uncertain prefixes for cleanup / fill / sync decisions.
 */
export function buildKeyReferenceContext(
  ctx: Context,
  eff: EffectiveReferenceConfig,
): KeyReferenceContext {
  return buildKeyReferenceContextCore(toExtractorScanInput(ctx), eff);
}
