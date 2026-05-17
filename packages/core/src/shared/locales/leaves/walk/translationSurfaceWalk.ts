import type { LocaleLeafFileOrigin } from '../../../../types/locales/leaves/fileOrigin.js';
import type { TranslationSurfaceLeaf } from '../../../../types/locales/leaves/translationSurface.js';

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
 * types (`generate --resume` may use meta-first eligibility; otherwise it falls back to `value === source` only).
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

function pushStructuredRow(
  out: TranslationSurfaceLeaf[],
  prefix: string,
  root: Record<string, unknown>,
  fileOrigin: LocaleLeafFileOrigin | undefined,
): void {
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
    ...(fileOrigin ? { fileOrigin } : {}),
  });
}

/**
 * Depth-first collection of translation string terminals: legacy plain strings **or** structured
 * `{ value: string, … }` objects (no descent into structured leaf objects — paths align with the source locale).
 *
 * Replaces naive `collectStringLeaves` for locale parity, **quality**, **sync** coverage, etc.
 *
 * @param fileOrigin - When set, every emitted leaf includes this storage provenance (flat single-file layout today).
 */
export function collectTranslationSurfaceLeaves(
  root: unknown,
  prefix = '',
  out: TranslationSurfaceLeaf[] = [],
  fileOrigin?: LocaleLeafFileOrigin,
): TranslationSurfaceLeaf[] {
  if (typeof root === 'string') {
    if (prefix) {
      out.push({
        path: prefix,
        value: root,
        shape: 'legacy_string',
        confidence: null,
        needsReview: null,
        ...(fileOrigin ? { fileOrigin } : {}),
      });
    }
    return out;
  }

  if (isStructuredLocaleLeafNode(root)) {
    if (prefix) pushStructuredRow(out, prefix, root, fileOrigin);
    return out;
  }

  if (Array.isArray(root)) {
    root.forEach((item, i) => {
      const p = prefix ? `${prefix}[${i}]` : `[${i}]`;
      collectTranslationSurfaceLeaves(item, p, out, fileOrigin);
    });
    return out;
  }

  if (isPlainObject(root)) {
    for (const k of Object.keys(root)) {
      const p = prefix ? `${prefix}.${k}` : k;
      collectTranslationSurfaceLeaves(root[k], p, out, fileOrigin);
    }
  }

  return out;
}
