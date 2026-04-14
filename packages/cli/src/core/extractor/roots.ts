import { buildFunctionsPattern } from '@/core/extractor/pattern.js';
import { resolveKeyPlaceholdersWithTrace } from '@/core/constmap/resolve.js';

/** Prefix roots from template calls when full key cannot be resolved. */
export function usedRootsFromText(text: string, functions: string[], constMap: Record<string, string>): Set<string> {
  const roots = new Set<string>();
  const fn = buildFunctionsPattern(functions);
  const tplRe = new RegExp(`\\b${fn}\\s*\\(\\s*\`([^\`]+)\`\\s*(?:,|\\))`, 'g');
  let m: RegExpExecArray | null;
  while ((m = tplRe.exec(text)) !== null) {
    const inner = m[1]!;
    const resolved = resolveKeyPlaceholdersWithTrace(inner, constMap).resolved;
    if (resolved) {
      roots.add(resolved.split('.')[0] ?? resolved);
    } else {
      const staticPart = inner.split('${')[0]?.replace(/\.$/, '') ?? '';
      if (staticPart) roots.add(staticPart.split('.')[0]!);
    }
  }
  return roots;
}
