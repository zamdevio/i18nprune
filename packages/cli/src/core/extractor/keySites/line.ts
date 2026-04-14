/** 1-based line number for a character index in `text`. */
export function lineNumberAtIndex(text: string, index: number): number {
  if (index <= 0) return 1;
  let line = 1;
  const end = Math.min(index, text.length);
  for (let i = 0; i < end; i++) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}
