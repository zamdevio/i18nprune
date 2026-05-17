import type { LocaleSegmentSource } from '../../../../types/locales/leaves/segmentSource.js';
import type { TranslationSurfaceLeaf } from '../../../../types/locales/leaves/translationSurface.js';

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export function isStructuredLocaleLeafNode(x: unknown): x is Record<string, unknown> {
  return isPlainObject(x) && typeof x.value === 'string';
}

function readOptionalStatus(o: Record<string, unknown>): string | undefined {
  const s = o.status;
  if (typeof s !== 'string' || !s.trim()) return undefined;
  return s;
}

function readOptionalCatalogSource(o: Record<string, unknown>): string | undefined {
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
  segmentSource: LocaleSegmentSource | undefined,
): void {
  out.push({
    path: prefix,
    value: root.value as string,
    shape: 'structured',
    status: readOptionalStatus(root),
    confidence: readConfidence(root),
    needsReview: readNeedsReview(root),
    needsTranslationAgain: readNeedsTranslationAgain(root),
    catalogSource: readOptionalCatalogSource(root),
    structuredMetaComplete: isCompleteStructuredLocaleLeafMeta(root),
    ...(segmentSource ? { source: segmentSource } : {}),
  });
}

export function collectTranslationSurfaceLeaves(
  root: unknown,
  prefix = '',
  out: TranslationSurfaceLeaf[] = [],
  segmentSource?: LocaleSegmentSource,
): TranslationSurfaceLeaf[] {
  if (typeof root === 'string') {
    if (prefix) {
      out.push({
        path: prefix,
        value: root,
        shape: 'legacy_string',
        confidence: null,
        needsReview: null,
        ...(segmentSource ? { source: segmentSource } : {}),
      });
    }
    return out;
  }

  if (isStructuredLocaleLeafNode(root)) {
    if (prefix) pushStructuredRow(out, prefix, root, segmentSource);
    return out;
  }

  if (Array.isArray(root)) {
    root.forEach((item, i) => {
      const p = prefix ? `${prefix}[${i}]` : `[${i}]`;
      collectTranslationSurfaceLeaves(item, p, out, segmentSource);
    });
    return out;
  }

  if (isPlainObject(root)) {
    for (const k of Object.keys(root)) {
      const p = prefix ? `${prefix}.${k}` : k;
      collectTranslationSurfaceLeaves(root[k], p, out, segmentSource);
    }
  }

  return out;
}
