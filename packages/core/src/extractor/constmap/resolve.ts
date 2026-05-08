import type { ResolveKeyPlaceholdersTraceResult } from '../../types/extractor/constmap/index.js';
import type { ConstSubstitutionStep } from '../../types/extractor/keySites/index.js';

/**
 * Resolve `${IDENT}` placeholders in a key fragment and keep an ordered trace
 * of substitutions applied from `constMap`.
 */
export function resolveKeyPlaceholdersWithTrace(
  fragment: string,
  constMap: Record<string, string>,
): ResolveKeyPlaceholdersTraceResult {
  let out = fragment;
  const substitutions: ConstSubstitutionStep[] = [];
  const re = /\$\{([A-Za-z_$][\w$]*)\}/;
  for (let i = 0; i < 64; i += 1) {
    const m = re.exec(out);
    if (!m) break;
    const name = m[1]!;
    const val = constMap[name];
    if (val === undefined) {
      return { resolved: null, substitutions, remainder: out };
    }
    substitutions.push({ identifier: name, value: val });
    out = out.replace(m[0]!, val);
  }
  if (/\$\{[^}]+\}/.test(out)) {
    return { resolved: null, substitutions, remainder: out };
  }
  return { resolved: out, substitutions, remainder: out };
}

