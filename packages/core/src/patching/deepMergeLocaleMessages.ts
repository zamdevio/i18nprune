/**
 * Deep-merge plain locale message trees for generated multi-segment loaders (BUG-004).
 *
 * - Plain objects recurse.
 * - Arrays, primitives, and non-plain values: `source` wins.
 * - Overlapping object layers across segment files are intentional and supported.
 */

export type LocaleMessageTree = Record<string, unknown>;

function isPlainObject(value: unknown): value is LocaleMessageTree {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function deepMergeLocaleMessages(
  target: LocaleMessageTree,
  source: LocaleMessageTree,
): LocaleMessageTree {
  const out: LocaleMessageTree = { ...target };
  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = out[key];
    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      out[key] = deepMergeLocaleMessages(targetValue, sourceValue);
    } else {
      out[key] = sourceValue;
    }
  }
  return out;
}

/** Source text inlined into generated loaders — keep behaviour aligned with {@link deepMergeLocaleMessages}. */
export const DEEP_MERGE_LOCALE_MESSAGES_HELPER_SOURCE = `function deepMergeLocaleMessages(
  target: LocaleMessages,
  source: LocaleMessages,
): LocaleMessages {
  const out: LocaleMessages = { ...target };
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = out[key];
    if (
      targetValue !== null &&
      sourceValue !== null &&
      typeof targetValue === 'object' &&
      typeof sourceValue === 'object' &&
      !Array.isArray(targetValue) &&
      !Array.isArray(sourceValue)
    ) {
      out[key] = deepMergeLocaleMessages(
        targetValue as LocaleMessages,
        sourceValue as LocaleMessages,
      );
    } else {
      out[key] = sourceValue;
    }
  }
  return out;
}`;
