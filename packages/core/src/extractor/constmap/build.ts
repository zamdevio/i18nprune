/** `const Name = 'value'` → map for `${CONST}` in key templates. */
export function buildConstStringMap(source: string): Record<string, string> {
  const map: Record<string, string> = {};
  const declRe =
    /\b(?:export\s+)?(?:const|let|readonly\s+(?:const|let))\s+([A-Za-z_$][\w$]*)(?:\s*:\s*[^=]+)?\s*=\s*(['"`])([^'"`]+)\2/g;
  let m: RegExpExecArray | null;
  while ((m = declRe.exec(source)) !== null) {
    map[m[1]!] = m[3]!;
  }

  for (const name of Object.keys(map)) {
    if (isReassignedInSource(source, name)) delete map[name];
  }

  return map;
}

function isReassignedInSource(source: string, name: string): boolean {
  const assignRe = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=`, 'g');
  let m: RegExpExecArray | null;
  while ((m = assignRe.exec(source)) !== null) {
    const before = source.slice(Math.max(0, m.index - 48), m.index);
    if (!/(?:\bconst|\blet|\breadonly\s+(?:const|let))\s*$/.test(before)) return true;
  }
  return false;
}
