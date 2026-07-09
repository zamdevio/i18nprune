import fs from 'node:fs';

export function readLocaleJson(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
}

function leafValue(node: unknown): string | undefined {
  if (typeof node === 'string') return node;
  if (
    node &&
    typeof node === 'object' &&
    'value' in node &&
    typeof (node as { value?: unknown }).value === 'string'
  ) {
    return (node as { value: string }).value;
  }
  return undefined;
}

export function flattenLocaleLeafValues(
  node: unknown,
  prefix = '',
  out: Record<string, string> = {},
): Record<string, string> {
  const value = leafValue(node);
  if (value !== undefined) {
    out[prefix] = value;
    return out;
  }
  if (!node || typeof node !== 'object') return out;
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    const p = prefix ? `${prefix}.${k}` : k;
    flattenLocaleLeafValues(v, p, out);
  }
  return out;
}
