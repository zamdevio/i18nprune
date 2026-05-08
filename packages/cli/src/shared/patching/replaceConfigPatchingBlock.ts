/**
 * Replacement start index for rewriting a top-level **`property:`** slice in a config object.
 *
 * JavaScript `\b`-matches the **keyword** (`patching`) at **`m.index`**, but callers must not keep the
 * old line indent before it: **`slice(0, m.index)`** would concatenate with a snippet that already
 * includes its own indent, doubling spaces on **`patching: {`** each run (`--force` churn).
 *
 * When the span from the preceding newline → **`keyMatchIndex`** is **only whitespace** (the line’s
 * indent before the key), replacements start there so **one** indentation is authoritative.
 */
export function replaceStartBeforePropertyKey(fileText: string, keyMatchIndex: number): number {
  const lineStart = keyMatchIndex > 0 ? fileText.lastIndexOf('\n', keyMatchIndex - 1) : -1;
  const bol = lineStart < 0 ? 0 : lineStart + 1;
  const gap = fileText.slice(bol, keyMatchIndex);
  if (gap === '' || /^[\t ]+$/.test(gap)) return bol;
  return keyMatchIndex;
}
