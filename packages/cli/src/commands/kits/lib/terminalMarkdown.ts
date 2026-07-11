import process from 'node:process';
import type { RunOptions } from '@i18nprune/core';
import { style } from '@/utils/style/index.js';

const ANSI_RE = /\u001b\[/;

function renderInlineMarkdownBold(line: string): string {
  return line.replace(/\*\*(.+?)\*\*/g, (_, inner: string) => style.bold(inner));
}

function formatKitsSampleRow(line: string): string {
  const match = /^(- \[[^\]]+\])(.+)$/.exec(line);
  if (!match) return renderInlineMarkdownBold(line);
  return `${match[1]}${style.dim(match[2]!)}`;
}

function formatKitsTerminalMarkdownLine(line: string): string {
  if (ANSI_RE.test(line)) return line;
  const trimmed = line.trimStart();
  if (/^#{2,3}\s/.test(trimmed)) {
    return style.bold(trimmed.replace(/^#+\s+/, ''));
  }
  if (trimmed.startsWith('>')) return style.dim(line);
  if (/^Docs:\s/i.test(trimmed) || /^Note:/i.test(trimmed)) return style.dim(line);
  if (/^\s·/.test(line) && /dynamic site\(s\) shown|more \(use --full/.test(line)) {
    return style.dim(line);
  }
  if (/^-\s\[[^\]]+\]/.test(line)) return formatKitsSampleRow(line);
  if (/^-\s/.test(line) && /\*\*.+\*\*/.test(line)) {
    return renderInlineMarkdownBold(line);
  }
  if (/^-\sDynamic groups:/.test(line)) {
    return style.dim(line);
  }
  return line;
}

/** Layer dim/bold styling on kits markdown for TTY output (`**` → bold, secondary lines dim). */
export function formatKitsTerminalMarkdown(md: string, run: Pick<RunOptions, 'json' | 'noColor'>): string {
  if (run.json || run.noColor || !process.stdout.isTTY) return md;
  return md.split('\n').map(formatKitsTerminalMarkdownLine).join('\n');
}
