/** Resolve `${CONST}` in a key fragment using `constMap`; returns `null` if any `${...}` remains unresolved. */
export function resolveKeyPlaceholders(fragment: string, constMap: Record<string, string>): string | null {
  let out = fragment;
  const re = /\$\{([A-Za-z_$][\w$]*)\}/;
  for (let i = 0; i < 64; i += 1) {
    const m = re.exec(out);
    if (!m) break;
    const name = m[1]!;
    const val = constMap[name];
    if (val === undefined) return null;
    out = out.replace(m[0]!, val);
  }
  if (/\$\{[^}]+\}/.test(out)) return null;
  return out;
}
