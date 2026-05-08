import chalk from 'chalk';

/**
 * ANSI tokens for `review` human output: orange brand tag, dim tool segment, and
 * semantic level colors (info / warn / error) on stderr-friendly lines.
 */
const ansi = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  fg: {
    orange: '\x1b[38;5;208m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
  },
} as const;

const TOOL_TAG = `${ansi.dim}${ansi.bold}[review]${ansi.reset}`;

/** Warm accent for counts and metrics inside log lines. */
const COUNT = chalk.hex('#e5c07b');

function accentNumericTokens(msg: string): string {
  return msg.replace(/\b\d+\b/g, (m) => COUNT(m));
}

function levelTag(level: 'info' | 'warn' | 'error'): string {
  if (level === 'info') return `${ansi.fg.green}[info]${ansi.reset}`;
  if (level === 'warn') return `${ansi.fg.yellow}[warn]${ansi.reset}`;
  return `${ansi.fg.red}[error]${ansi.reset}`;
}

function brand(): string {
  return `${ansi.dim}${ansi.bold}${ansi.fg.orange}[i18nprune]${ansi.reset}`;
}

/** Primary line: `[i18nprune] [review] [level] message` (counts highlighted). */
export function formatReviewToolLine(
  level: 'info' | 'warn' | 'error',
  message: string,
): string {
  return `${brand()} ${TOOL_TAG} ${levelTag(level)} ${accentNumericTokens(message)}`;
}

/** Secondary line: brand + dim body (tips); counts still highlighted. */
export function formatReviewDetailLine(dimBody: string): string {
  return `${brand()}   ${chalk.dim(accentNumericTokens(dimBody))}`;
}

/** Section title (bold cyan rule). */
export function formatReviewSectionTitle(label: string): string {
  return chalk.bold.cyan(`  ── ${label} ──`);
}

/** Per-locale subheading (bold gold file label). */
export function formatReviewLocaleHeading(label: string): string {
  return chalk.bold.hex('#d19a66')(`  ${label}`);
}
