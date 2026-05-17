/**
 * JS/TS-like lexical walks for **comments** and **string/template literal interiors** — shared by
 * import binding scan, key-site scan, and dynamic analysis.
 */

function skipString(text: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) return i + 1;
    i += 1;
  }
  return text.length;
}

function skipTemplate(text: string, start: number): number {
  let i = start + 1;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') return i + 1;
    if (ch === '$' && text[i + 1] === '{') {
      i += 2;
      let depth = 1;
      while (i < text.length && depth > 0) {
        const c2 = text[i]!;
        if (c2 === '{') depth += 1;
        else if (c2 === '}') depth -= 1;
        i += 1;
      }
      continue;
    }
    i += 1;
  }
  return text.length;
}

/** Merge overlapping or adjacent [start, end) spans (sorted by start). */
export function mergeRanges(ranges: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const out: Array<{ start: number; end: number }> = [];
  let cur = sorted[0]!;
  for (let k = 1; k < sorted.length; k += 1) {
    const n = sorted[k]!;
    if (n.start <= cur.end) {
      cur = { start: cur.start, end: Math.max(cur.end, n.end) };
    } else {
      out.push(cur);
      cur = n;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Build [start, end) ranges where text is inside line (`//`) or block comments in JS/TS-like source.
 * Walks the file with a small state machine: code vs strings vs templates vs comments.
 */
export function commentRangesForJsLikeText(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const c = text[i]!;

    if (c === '/' && text[i + 1] === '/') {
      const start = i;
      i += 2;
      while (i < len && text[i] !== '\n') i += 1;
      ranges.push({ start, end: i });
      continue;
    }

    if (c === '/' && text[i + 1] === '*') {
      const start = i;
      i += 2;
      while (i + 1 < len) {
        if (text[i] === '*' && text[i + 1] === '/') {
          i += 2;
          ranges.push({ start, end: i });
          break;
        }
        i += 1;
      }
      if (i >= len && start >= 0 && !ranges.some((r) => r.start === start)) {
        ranges.push({ start, end: len });
      }
      continue;
    }

    if (c === "'" || c === '"') {
      i = skipString(text, i, c);
      continue;
    }

    if (c === '`') {
      i = skipTemplate(text, i);
      continue;
    }

    i += 1;
  }

  return mergeRanges(ranges);
}

/**
 * Build [start, end) ranges for single-quoted, double-quoted, and template literal **interiors**
 * in JS/TS-like source (same string/template rules as {@link commentRangesForJsLikeText}).
 *
 * @remarks Blanks **only the interior** between delimiters so surrounding `from '…'` syntax stays
 * valid for import regexes. Does not recurse into `` `${}` `` — the whole template body (between
 * backticks) is one interior span.
 */
export function literalRangesForJsLikeText(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const c = text[i]!;

    if (c === '/' && text[i + 1] === '/') {
      i += 2;
      while (i < len && text[i] !== '\n') i += 1;
      continue;
    }

    if (c === '/' && text[i + 1] === '*') {
      i += 2;
      while (i + 1 < len) {
        if (text[i] === '*' && text[i + 1] === '/') {
          i += 2;
          break;
        }
        i += 1;
      }
      if (i >= len) break;
      continue;
    }

    if (c === "'" || c === '"') {
      const start = i;
      i = skipString(text, i, c);
      if (i > start + 1) ranges.push({ start: start + 1, end: i - 1 });
      continue;
    }

    if (c === '`') {
      const start = i;
      i = skipTemplate(text, i);
      if (i > start + 1) ranges.push({ start: start + 1, end: i - 1 });
      continue;
    }

    i += 1;
  }

  return mergeRanges(ranges);
}

/**
 * Merged comment + string/template interiors for blanking before import-binding regex scans.
 */
export function importBindingScanBlankRanges(text: string): Array<{ start: number; end: number }> {
  return mergeRanges([...commentRangesForJsLikeText(text), ...literalRangesForJsLikeText(text)]);
}

export function offsetInCommentRanges(
  offset: number,
  ranges: Array<{ start: number; end: number }>,
): boolean {
  for (const r of ranges) {
    if (offset >= r.start && offset < r.end) return true;
  }
  return false;
}
