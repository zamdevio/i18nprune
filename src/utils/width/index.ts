import stringWidth from 'string-width';
import { stripAnsiVisible } from '@/utils/ansi/index.js';

/** Terminal display width (Unicode East Asian / wide chars; ANSI stripped). */
export function displayWidth(s: string): number {
  return stringWidth(stripAnsiVisible(s));
}

/** Pad with spaces on the right to reach target **display** columns (not code units). */
export function padToDisplayWidth(s: string, target: number): string {
  const w = displayWidth(s);
  if (w >= target) return truncateToDisplayWidth(s, target);
  return s + ' '.repeat(target - w);
}

/** Truncate to fit target display columns; appends `…` when shortened. */
export function truncateToDisplayWidth(s: string, max: number): string {
  const plain = stripAnsiVisible(s);
  if (stringWidth(plain) <= max) return s;
  if (max <= 1) return '…';
  let out = '';
  for (const ch of plain) {
    const next = out + ch;
    if (stringWidth(next) > max - 1) break;
    out = next;
  }
  return `${out}…`;
}
