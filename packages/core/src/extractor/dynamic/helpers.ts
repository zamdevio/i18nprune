/** Single-line preview for logs / JSON. */
export function snippet(text: string, start: number, maxLen: number): string {
  const slice = text.slice(start, start + maxLen).replace(/\s+/g, ' ').trim();
  return slice.length < maxLen ? slice : `${slice.slice(0, maxLen - 1)}…`;
}

/** Single-line preview from an explicit [start, end) range. */
export function snippetRange(text: string, start: number, end: number, maxLen: number): string {
  const boundedEnd = Math.max(start, Math.min(end, text.length));
  const slice = text.slice(start, boundedEnd).replace(/\s+/g, ' ').trim();
  if (slice.length <= maxLen) return slice;
  return `${slice.slice(0, maxLen - 1)}…`;
}

/** 1-based line and column (UTF-16) for `offset` in `text`. */
export function offsetToLineColumn(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset && i < text.length; i += 1) {
    const c = text[i]!;
    if (c === '\n') {
      line += 1;
      col = 1;
    } else {
      col += 1;
    }
  }
  return { line, column: col };
}

