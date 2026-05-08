/**
 * Walk non-source locale JSON the same way translation-aware tools do: leaves are either
 * plain strings ("legacy") or objects with a string `value` plus optional review metadata.
 */
export type ReviewLeafShape = 'legacy_string' | 'structured';

export type ReviewLeafRow = {
  path: string;
  value: string;
  shape: ReviewLeafShape;
  /** Present when `shape === 'structured'` and the field exists. */
  status?: string;
  confidence: number | null;
  needsReview: boolean | null;
  /** Present when `shape === 'structured'` and the field exists. */
  needsTranslationAgain?: boolean | null;
  source?: string;
  /**
   * When `shape === 'structured'`, true iff the JSON node has every canonical metadata field
   * with valid types (see {@link isCompleteStructuredLocaleLeafMeta}).
   */
  structuredMetaComplete?: boolean;
};

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/** True when the node is a terminal translation leaf `{ value: string, … }` (not a nested tree). */
export function isStructuredLocaleLeafNode(x: unknown): x is Record<string, unknown> {
  return isPlainObject(x) && typeof x.value === 'string';
}

function readOptionalStatus(o: Record<string, unknown>): string | undefined {
  const s = o.status;
  if (typeof s !== 'string' || !s.trim()) return undefined;
  return s;
}

function readOptionalSource(o: Record<string, unknown>): string | undefined {
  const s = o.source;
  if (typeof s !== 'string' || !s.trim()) return undefined;
  return s;
}

function readConfidence(o: Record<string, unknown>): number | null {
  const c = o.confidence;
  if (c === null || c === undefined) return null;
  if (typeof c !== 'number' || !Number.isFinite(c)) return null;
  const clamped = Math.max(0, Math.min(1, c));
  return Math.round(clamped * 100) / 100;
}

function readNeedsReview(o: Record<string, unknown>): boolean | null {
  if (!('needsReview' in o)) return null;
  return typeof o.needsReview === 'boolean' ? o.needsReview : null;
}

function readNeedsTranslationAgain(o: Record<string, unknown>): boolean | null {
  if (!('needsTranslationAgain' in o)) return null;
  return typeof o.needsTranslationAgain === 'boolean' ? o.needsTranslationAgain : null;
}

/**
 * True when a structured locale terminal has **all** canonical metadata fields present with valid
 * types (`fill` may use meta-first eligibility; otherwise it falls back to `value === source` only).
 */
export function isCompleteStructuredLocaleLeafMeta(node: unknown): boolean {
  if (!isStructuredLocaleLeafNode(node)) return false;
  const o = node;
  if (typeof o.status !== 'string' || !o.status.trim()) return false;
  if (!(o.confidence === null || (typeof o.confidence === 'number' && Number.isFinite(o.confidence)))) return false;
  if (typeof o.needsReview !== 'boolean') return false;
  if (typeof o.needsTranslationAgain !== 'boolean') return false;
  if (typeof o.source !== 'string' || !o.source.trim()) return false;
  return true;
}

/**
 * Depth-first collection of string leaves and structured `{ value }` terminals (no recursion
 * into structured leaf objects — matches how locale files store one object per key path).
 */
export function collectReviewLeaves(root: unknown, prefix = '', out: ReviewLeafRow[] = []): ReviewLeafRow[] {
  if (typeof root === 'string') {
    if (prefix) out.push({ path: prefix, value: root, shape: 'legacy_string', confidence: null, needsReview: null });
    return out;
  }

  if (isStructuredLocaleLeafNode(root)) {
    if (!prefix) return out;
    const structuredMetaComplete = isCompleteStructuredLocaleLeafMeta(root);
    out.push({
      path: prefix,
      value: root.value as string,
      shape: 'structured',
      status: readOptionalStatus(root),
      confidence: readConfidence(root),
      needsReview: readNeedsReview(root),
      needsTranslationAgain: readNeedsTranslationAgain(root),
      source: readOptionalSource(root),
      structuredMetaComplete,
    });
    return out;
  }

  if (Array.isArray(root)) {
    root.forEach((item, i) => {
      const p = prefix ? `${prefix}[${i}]` : `[${i}]`;
      collectReviewLeaves(item, p, out);
    });
    return out;
  }

  if (isPlainObject(root)) {
    for (const k of Object.keys(root)) {
      const p = prefix ? `${prefix}.${k}` : k;
      collectReviewLeaves(root[k], p, out);
    }
  }

  return out;
}
