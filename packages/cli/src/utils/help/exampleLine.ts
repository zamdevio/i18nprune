import { CLI_NAME } from '@/constants/cli.js';
import { shortFlagTakesValue } from '@/argv/flagAliases.js';
import { style } from '@/utils/style/index.js';

const LONG_VALUE_FLAGS = new Set([
  '--target',
  '--config',
  '--top',
  '--provider',
  '--workers',
  '--format',
  '--only',
  '--out',
  '--from',
  '--filter',
  '--preset',
  '--fail-on',
  '--max-dynamic',
  '--baseline',
  '--save-baseline',
  '--contains',
  '--focus',
  '--locales-dir',
  '--functions',
  '--exclude',
  '--cache-profile',
  '--source',
  '--src',
  '--worker-url',
  '--project',
  '--report',
]);

function flagTokenTakesValue(token: string): boolean {
  if (shortFlagTakesValue(token)) return true;
  if (token.startsWith('--') && token.includes('=')) return false;
  return LONG_VALUE_FLAGS.has(token);
}

/** Colorize one Examples line: brand-blue binary, cyan command path, dim flags/values. */
export function styleExampleLine(line: string): string {
  const tokens = line.trim().split(/\s+/);
  if (!tokens.length) return '';
  const out: string[] = [];
  let i = 0;

  if (tokens[0] === CLI_NAME) {
    out.push(style.bold(style.brand(tokens[0]!)));
    i = 1;
  }

  while (i < tokens.length && !tokens[i]!.startsWith('-')) {
    out.push(style.bold(style.accent(tokens[i]!)));
    i += 1;
  }

  while (i < tokens.length) {
    const token = tokens[i]!;
    out.push(style.dim(token));
    if (flagTokenTakesValue(token)) {
      const next = tokens[i + 1];
      if (next !== undefined && !next.startsWith('-')) {
        i += 1;
        out.push(style.dim(tokens[i]!));
      }
    }
    i += 1;
  }

  return `  ${out.join(' ')}`;
}
