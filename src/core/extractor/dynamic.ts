import { buildFunctionsPattern, escapeRegex } from '@/core/extractor/pattern.js';
import type { DynamicKeySite } from '@/types/core/extractor/index.js';

/**
 * Find translation calls whose first argument is **not** a simple static string
 * (so `validate` cannot treat them as literal keys). We **do not** execute code —
 * heuristics only; goal is warn, not false confidence.
 */
export function findDynamicKeySites(text: string, functions: string[]): DynamicKeySite[] {
  const out: DynamicKeySite[] = [];
  const fn = buildFunctionsPattern(functions);
  const callStart = new RegExp(`\\b(${fn})\\s*\\(`, 'g');

  let m: RegExpExecArray | null;
  while ((m = callStart.exec(text)) !== null) {
    const functionName = m[1]!;
    const at = m.index!;
    const fnEsc = escapeRegex(functionName);
    const decl = new RegExp(`\\b(?:export\\s+)?function\\s+${fnEsc}\\s*\\(`);
    if (decl.test(text.slice(Math.max(0, at - 48), at + functionName.length + 2))) {
      continue;
    }
    const openParen = at + m[0].length - 1;
    let i = openParen + 1;
    while (i < text.length && /\s/.test(text[i]!)) i += 1;
    if (i >= text.length) {
      out.push({ kind: 'empty_call', functionName, preview: snippet(text, m.index!, 72) });
      continue;
    }
    const c = text[i]!;
    if (c === "'" || c === '"') {
      continue;
    }
    if (c === '`') {
      const tplEnd = text.indexOf('`', i + 1);
      if (tplEnd === -1) {
        out.push({ kind: 'template_interpolation', functionName, preview: snippet(text, m.index!, 72) });
        continue;
      }
      const inner = text.slice(i + 1, tplEnd);
      if (/\$\{/.test(inner)) {
        out.push({ kind: 'template_interpolation', functionName, preview: snippet(text, m.index!, 72) });
      }
      continue;
    }
    out.push({ kind: 'non_literal', functionName, preview: snippet(text, m.index!, 72) });
  }
  return out;
}

function snippet(text: string, start: number, maxLen: number): string {
  const slice = text.slice(start, start + maxLen).replace(/\s+/g, ' ').trim();
  return slice.length < maxLen ? slice : `${slice.slice(0, maxLen - 1)}…`;
}
