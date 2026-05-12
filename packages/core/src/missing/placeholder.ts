import { DEFAULT_MISSING_LEAF_PLACEHOLDER } from '../shared/constants/missing.js';

/** Max length for **`config.missing.placeholder`**; longer values fall back to the default with a warning. */
export const MISSING_LEAF_PLACEHOLDER_MAX_LEN = 256;

/**
 * Resolve the leaf placeholder used by **`missing`** (and tooling that must grep the same sentinel).
 * Empty / whitespace-only / overlong / non-string values fall back to **`DEFAULT_MISSING_LEAF_PLACEHOLDER`**
 * and return human-readable **`warnings`** for the host to log once.
 */
export function resolveMissingLeafPlaceholder(raw: unknown): { placeholder: string; warnings: string[] } {
  const warnings: string[] = [];
  const def = DEFAULT_MISSING_LEAF_PLACEHOLDER;
  if (raw === undefined) return { placeholder: def, warnings };
  if (typeof raw !== 'string') {
    warnings.push(
      `missing.placeholder must be a string; got ${typeof raw}. Using default ${JSON.stringify(def)} for reliable detection.`,
    );
    return { placeholder: def, warnings };
  }
  const t = raw.trim();
  if (t.length === 0) {
    warnings.push(
      `missing.placeholder is empty or whitespace-only; using default ${JSON.stringify(def)} so missing tooling can detect scaffolded paths.`,
    );
    return { placeholder: def, warnings };
  }
  if (t.length > MISSING_LEAF_PLACEHOLDER_MAX_LEN) {
    warnings.push(
      `missing.placeholder exceeds ${String(MISSING_LEAF_PLACEHOLDER_MAX_LEN)} characters; using default ${JSON.stringify(def)}.`,
    );
    return { placeholder: def, warnings };
  }
  return { placeholder: t, warnings };
}
