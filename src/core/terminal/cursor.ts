/** ANSI: hide terminal cursor (VT220). */
export function hideCursor(): string {
  return '\u001B[?25l';
}

/** ANSI: show terminal cursor. */
export function showCursor(): string {
  return '\u001B[?25h';
}

/** Force show cursor regardless of nesting (e.g. after signal). */
export function forceShowCursor(): void {
  process.stdout.write(showCursor());
}
