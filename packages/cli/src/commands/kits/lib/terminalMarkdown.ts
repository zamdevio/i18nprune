import process from 'node:process';
import type { RunOptions } from '@i18nprune/core';
import { style } from '@/utils/style/index.js';

const ANSI_RE = /\u001b\[/;

function formatKitsSampleRow(line: string): string {
  const match = /^(- \[[^\]]+\])(.+)$/.exec(line);
  if (!match) return line;
  return `${match[1]}${style.dim(match[2]!)}`;
}

function formatKitsTerminalMarkdownLine(line: string): string {
  if (ANSI_RE.test(line)) return line;
  const trimmed = line.trimStart();
  if (trimmed.startsWith('>')) return style.dim(line);
  if (/^Docs:\s/i.test(trimmed) || /^Note:/i.test(trimmed)) return style.dim(line);
  if (/^-\s\[[^\]]+\]/.test(line)) return formatKitsSampleRow(line);
  return line;
}

/** Layer dim styling on secondary markdown lines for TTY kits output. */
export function formatKitsTerminalMarkdown(md: string, run: Pick<RunOptions, 'json' | 'noColor'>): string {
  if (run.json || run.noColor || !process.stdout.isTTY) return md;
  return md.split('\n').map(formatKitsTerminalMarkdownLine).join('\n');
}
