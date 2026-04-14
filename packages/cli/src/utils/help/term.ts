import { style } from '@/utils/style/index.js';

/**
 * Commander "Commands:" column: subcommand name **green**, bracket placeholders **`[options]`** dim.
 */
export function styleCommandHelpTerm(term: string): string {
  const t = term.trim();
  const m = /^([a-z][\w-]*)([\s\S]*)$/i.exec(t);
  if (!m) return style.bold(style.ok(term));
  const name = m[1]!;
  const rest = m[2] ?? '';
  if (!rest.trim()) return style.bold(style.ok(name));
  const restStyled = rest.replace(/(\[[^\]]+\])/g, (seg) => style.dim(style.accent(seg)));
  return `${style.bold(style.ok(name))}${restStyled}`;
}
