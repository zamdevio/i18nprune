import { escapeRegex } from '../shared/pattern.js';
import { IMPORT_BINDING_IDENT_PATTERN as IDENT } from './ident.js';

/**
 * Collect translation-helper candidates from first-parameter object destructuring
 * (`function Row({ t })` / `const Row = ({ t }) =>`).
 *
 * Renames (`{ t: translate }`) and rest elements are ignored. Local `function t()`
 * declarations are not prop binds.
 */
export function scanPropBoundLocals(text: string, propNames: readonly string[]): Set<string> {
  const wanted = new Set(propNames.filter((n) => n.trim().length > 0));
  const added = new Set<string>();
  if (wanted.size === 0) return added;

  const interiors: string[] = [];

  const functionParam = new RegExp(
    String.raw`(?:^|[;\n])\s*(?:export\s+)?(?:async\s+)?function\s+(?:${IDENT}\s*)?\(\s*\{([^}]*)\}`,
    'gmu',
  );
  const arrowParam = new RegExp(
    String.raw`(?:^|[;\n])\s*(?:export\s+)?(?:const|let)\s+${IDENT}\s*=\s*(?:async\s*)?\(\s*\{([^}]*)\}`,
    'gmu',
  );

  let m: RegExpExecArray | null;
  while ((m = functionParam.exec(text)) !== null) {
    if (m[1] !== undefined) interiors.push(m[1]);
  }
  while ((m = arrowParam.exec(text)) !== null) {
    if (m[1] !== undefined) interiors.push(m[1]);
  }

  for (const interior of interiors) {
    for (const name of bindingsFromDestructureInterior(interior, wanted)) {
      added.add(name);
    }
  }
  return added;
}

function bindingsFromDestructureInterior(interior: string, wanted: Set<string>): string[] {
  const out: string[] = [];
  for (const raw of interior.split(',')) {
    const part = raw.trim();
    if (!part || part.startsWith('...')) continue;
    // Skip renames: `t: translate` (binding is the RHS; out of scope for this slice).
    if (/^[A-Za-z_$][\w$]*\s*:/.test(part)) continue;
    const m = part.match(new RegExp(String.raw`^(${IDENT})`, 'u'));
    if (!m) continue;
    const name = m[1]!;
    if (wanted.has(name)) out.push(name);
  }
  return out;
}

/** Default prop names when `extractor.hoc.propNames` is omitted. */
export const DEFAULT_HOC_PROP_NAMES = ['t'] as const;

/**
 * True when the file might contain opt-in prop helper patterns for the given names.
 * Used to skip the prop scan when nothing can match.
 */
export function shouldScanPropHelpers(text: string, propNames: readonly string[]): boolean {
  for (const name of propNames) {
    if (!name) continue;
    const esc = escapeRegex(name);
    if (new RegExp(String.raw`\{\s*[^}]*\b${esc}\b`, 'u').test(text)) return true;
  }
  return false;
}
