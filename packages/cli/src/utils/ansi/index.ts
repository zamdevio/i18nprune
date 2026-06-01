import { style as baseStyle } from '@/utils/style/index.js';
import type { HeaderOptions, LogLevel } from '@/types/utils/ansi/index.js';
import { CLI_MARK, CLI_NAME } from '@/constants/cli.js';

/** Re-export semantic tokens for call sites that import from `ansi`. */
export const style = baseStyle;

export type { HeaderOptions, LogLevel } from '@/types/utils/ansi/index.js';

const levelColor: Record<LogLevel, (s: string) => string> = {
  info: style.ok,
  notice: style.warn,
  warn: style.warn,
  error: style.err,
};

/** `[label]` with dim brackets and colored inner text. */
export function bracketTag(label: string, color: (s: string) => string): string {
  return `${style.dim('[')}${color(label)}${style.dim(']')}`;
}

function appPrefix(): string {
  return `${style.dim('[')}${style.bold(style.accent(CLI_NAME))}${style.dim(']')}`;
}

/** Visible length for layout (ANSI SGR stripped). */
export function stripAnsiVisible(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

/** `[i18nprune] [level] message` — grep-friendly in CI. */
export function line(level: LogLevel, message: string): string {
  const tag = bracketTag(level, levelColor[level]);
  return `${appPrefix()} ${tag} ${message}`;
}

/** `[i18nprune] [scan] message` — same prefix family as {@link line}; used for `--debug-scan`. */
export function scanLine(message: string): string {
  return `${appPrefix()} ${bracketTag('scan', style.magenta)} ${message}`;
}

/** `[i18nprune] [cache] message` — report-cache status, hidden by the info gate. */
export function cacheLine(message: string): string {
  return `${appPrefix()} ${bracketTag('cache', style.accent)} ${message}`;
}

/** `[i18nprune] [verbose] message` — share view `--verbose` internals. */
export function verboseLine(message: string, dimBody = true): string {
  const tag = bracketTag('verbose', style.accent);
  const body = dimBody ? style.dim(message) : message;
  return `${appPrefix()} ${tag} ${body}`;
}

/** `[i18nprune] [tip] message` — actionable hints (orange; not warn-styled). */
export function tipLine(message: string): string {
  return `${appPrefix()} ${bracketTag('tip', style.tip)} ${message}`;
}

/**
 * Box header that **sizes to content** (ANSI-safe) — dim frame, bold title.
 * Uses **`CLI_MARK`** when `mark` is omitted; pass **`mark: ''`** to hide the icon.
 */
export function header(title: string, options?: HeaderOptions): string {
  const mark = options?.mark !== undefined ? options.mark : CLI_MARK;
  const markPart = mark !== '' ? `${style.dim(mark)} ` : '';
  const innerStyled = options?.subtitle
    ? ` ${markPart}${style.bold(title)} ${style.dim('—')} ${style.dim(options.subtitle)} `
    : ` ${markPart}${style.bold(title)} `;
  const innerLen = stripAnsiVisible(innerStyled).length;

  const cols =
    typeof process.stdout?.columns === 'number' && process.stdout.columns > 40
      ? process.stdout.columns
      : 100;
  const minW = options?.minWidth ?? 48;
  const cap = Math.max(minW, cols - 2);
  const natural = innerLen + 2;
  const w = Math.max(minW, Math.min(natural, cap));
  const pad = Math.max(0, w - innerLen - 1);

  const bar = '─'.repeat(w);
  return `${style.dim('╭')}${style.dim(bar)}${style.dim('╮')}\n${style.dim('│')}${innerStyled}${' '.repeat(pad)}${style.dim('│')}\n${style.dim('╰')}${style.dim(bar)}${style.dim('╯')}`;
}

/** Drop consecutive duplicate segments (e.g. `es · es · es · LTR` → `es · LTR`). */
export function joinMetaSubtitle(
  lang: string,
  englishName: string,
  nativeName: string,
  direction: 'ltr' | 'rtl',
): string {
  const d = direction.toUpperCase();
  const parts = [lang, englishName, nativeName, d];
  return parts.filter((x, i) => i === 0 || x !== parts[i - 1]).join(' · ');
}
