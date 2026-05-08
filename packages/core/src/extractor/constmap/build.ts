/** `const Name = 'value'` → map for `${CONST}` in key templates. */
export function buildConstStringMap(source: string): Record<string, string> {
  const map: Record<string, string> = {};
  const re = /\bconst\s+([A-Za-z_$][\w$]*)(?:\s*:\s*[^=]+)?\s*=\s*(['"`])([^'"`]+)\2\s*;?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    map[m[1]!] = m[3]!;
  }
  return map;
}

