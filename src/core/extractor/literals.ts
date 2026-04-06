import { buildFunctionsPattern } from '@/core/extractor/pattern.js';
import { resolveKeyPlaceholders } from '@/core/constmap/resolve.js';

/**
 * Collect exact literal translation keys from source text (quoted and simple templates).
 */
export function exactLiteralKeys(text: string, functions: string[], constMap: Record<string, string>): Set<string> {
  const keys = new Set<string>();
  const fn = buildFunctionsPattern(functions);

  const litRe = new RegExp(
    `\\b${fn}\\s*\\(\\s*(['"])([^'"]+?)\\1\\s*(?:,|\\))`,
    'g',
  );
  let m: RegExpExecArray | null;
  while ((m = litRe.exec(text)) !== null) {
    keys.add(m[2]!);
  }

  const tplRe = new RegExp(`\\b${fn}\\s*\\(\\s*\`([^\`]+)\`\\s*(?:,|\\))`, 'g');
  while ((m = tplRe.exec(text)) !== null) {
    const resolved = resolveKeyPlaceholders(m[1]!, constMap);
    if (resolved) keys.add(resolved);
  }

  return keys;
}
