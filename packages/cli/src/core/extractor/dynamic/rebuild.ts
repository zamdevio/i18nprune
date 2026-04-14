/**
 * Pre-dynamic rebuild: fold template literals toward static keys using the same file-level
 * `const Name = 'value'` map as **`exactLiteralKeys`** (`src/core/constmap/build.ts`).
 *
 * Why this collapses “dynamic” noise:
 * Many projects use `` t(`${NAMESPACE}.section.key`) `` where `NAMESPACE` is a **constant string**
 * declared once in the file. Without substitution, every such call looks “dynamic” because of
 * `` `${…}` ``. Once `${NAMESPACE}` is replaced with its literal value, the argument is a single
 * static key string — the same class of key `validate` already understands for quoted literals.
 *
 * Who uses **`buildConstStringMap`** / **`resolveKeyPlaceholdersWithTrace`** in this repo:
 * - **`exactLiteralKeys`** (literal extraction for validate)
 * - **Dynamic key detection** (this module) — after rebuild, fully resolved templates are not reported as dynamic
 *
 * Arbitrary expressions (`${user.id}`) are never substituted; only simple identifiers that appear
 * in the const map.
 */
import { resolveKeyPlaceholdersWithTrace } from '@/core/constmap/resolve.js';

/**
 * Returns the resolved static key if `inner` has no remaining `${...}` after const substitution;
 * otherwise `null` (still treat as dynamic / unknown).
 */
export function tryRebuildTemplateKeyFromConsts(
  inner: string,
  constMap: Record<string, string>,
): string | null {
  return resolveKeyPlaceholdersWithTrace(inner, constMap).resolved;
}

/**
 * When a template cannot be fully resolved, compute the longest **static prefix** of the key path:
 * take the substring **before** the first `${…}` whose identifier is missing from `constMap`, or
 * whose expression is not a simple identifier; then substitute known `${Ident}` segments in that
 * prefix only. Trailing dot is trimmed. Returns `null` if nothing useful remains (e.g. no dot path).
 */
export function tryResolveTemplatePrefixBeforeUnknown(
  inner: string,
  constMap: Record<string, string>,
): string | null {
  const interpRe = /\$\{([^}]+)\}/g;
  const matches = [...inner.matchAll(interpRe)];
  if (matches.length === 0) {
    const t = inner.trim();
    return t.includes('.') ? t : null;
  }

  let cutIndex = -1;
  for (const m of matches) {
    const expr = m[1]?.trim();
    const ident = expr?.match(/^[A-Za-z_$][\w$]*$/)?.[0];
    if (!ident) {
      cutIndex = m.index ?? -1;
      break;
    }
    if (!Object.prototype.hasOwnProperty.call(constMap, ident)) {
      cutIndex = m.index ?? -1;
      break;
    }
  }

  const prefix = (cutIndex === -1 ? inner : inner.slice(0, cutIndex)).trim();
  const resolved = prefix.replace(/\$\{([^}]+)\}/g, (whole, innerExpr: string) => {
    const ident = String(innerExpr).trim();
    if (/^[A-Za-z_$][\w$]*$/.test(ident) && Object.prototype.hasOwnProperty.call(constMap, ident)) {
      return constMap[ident]!;
    }
    return whole;
  });

  const trimmed = resolved.replace(/\.$/, '').trim();
  if (!trimmed.includes('.')) return null;
  return trimmed;
}
