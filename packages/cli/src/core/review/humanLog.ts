import chalk from 'chalk';

/**
 * ANSI tokens aligned with CepatEdge `scripts/locales/shared/ansi.ts` so `review` human
 * output matches that toolchain’s look (orange brand, dim tool tag, green/yellow/red levels).
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

function levelTag(level: 'info' | 'warn' | 'error'): string {
  if (level === 'info') return `${ansi.fg.green}[info]${ansi.reset}`;
  if (level === 'warn') return `${ansi.fg.yellow}[warn]${ansi.reset}`;
  return `${ansi.fg.red}[error]${ansi.reset}`;
}

/** Dim + bold orange `[i18nprune]` (CepatEdge uses `[CepatEdge]` with the same orange). */
function brand(): string {
  return `${ansi.dim}${ansi.bold}${ansi.fg.orange}[i18nprune]${ansi.reset}`;
}

/**
 * One primary log line: `[i18nprune] [review] [info|warn|error] message`
 * (same structure as CepatEdge `formatLocaleToolLine`).
 */
export function formatReviewToolLine(
  level: 'info' | 'warn' | 'error',
  message: string,
): string {
  return `${brand()} ${TOOL_TAG} ${levelTag(level)} ${message}`;
}

/** CepatEdge-style secondary line: brand prefix + dim body (stats / tips). */
export function formatReviewDetailLine(dimBody: string): string {
  return `${brand()}   ${chalk.dim(dimBody)}`;
}

/** Section header (CepatEdge uses `style.cyan('  ── … ──')`). */
export function formatReviewSectionTitle(label: string): string {
  return chalk.cyan(`  ── ${label} ──`);
}

/** Locale subheading under a section. */
export function formatReviewLocaleHeading(label: string): string {
  return chalk.cyan(`  ${label}`);
}
