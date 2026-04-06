import { Help } from 'commander';
import type { Command } from 'commander';
import { CLI_NAME } from '@/constants/cli.js';
import { getTopicBannerSubtitle, toolDisplayTitle } from '@/utils/cli/banner.js';
import { docsCommandUrl, docsSlugForCommand, getDocsUrl } from '@/constants/docs.js';
import { header } from '@/utils/ansi/index.js';
import { styleCommandHelpTerm } from '@/utils/help/term.js';
import { style } from '@/utils/style/index.js';

const SECTION_HEADER = /^(Options|Commands|Arguments|Global Options):$/;
const HELP_ROW = /^(\s{2})(.+?)(\s{2,})(.*)$/;
const DEFAULT_NOTE = /\(default:[^)]+\)/g;

function styleUsageLine(line: string): string {
  const rest = line.slice('Usage:'.length).trimStart();
  return `${style.bold(style.magenta('Usage:'))} ${style.bold(style.accent(rest))}`;
}

function styleSectionHeader(line: string): string {
  return style.bold(style.magenta(line));
}

function styleTerm(
  term: string,
  section: 'none' | 'arguments' | 'options' | 'commands' | 'global-options',
): string {
  if (/^-/.test(term)) {
    return term
      .split(/(,\s+|\|)/g)
      .map((part) => {
        if (part === '|' || part.trim() === ',') return style.dim(part);
        if (/^\s*,\s*$/.test(part)) return style.dim(part);
        return style.accent(part);
      })
      .join('');
  }
  if (term.includes('|')) {
    return term
      .split('|')
      .map((part, idx) => (idx === 0 ? style.bold(style.ok(part)) : style.ok(part)))
      .join(style.dim('|'));
  }
  if (/^\[/.test(term.trimStart())) {
    return style.warn(term);
  }
  if (section === 'commands') {
    const t = term.trim();
    if (/^[a-z][\w-]*(?:\s+\[[^\]]+\])*$/i.test(t)) {
      return styleCommandHelpTerm(term);
    }
  }
  return style.accent(term);
}

function styleDescription(desc: string): string {
  if (!desc) return '';
  const pieces = desc.split(DEFAULT_NOTE);
  const matches = desc.match(DEFAULT_NOTE) ?? [];
  let out = '';
  for (let i = 0; i < pieces.length; i += 1) {
    out += style.dim(pieces[i] ?? '');
    if (i < matches.length) out += style.warn(matches[i]!);
  }
  return out;
}

function appendDocsFooter(text: string, cmd: Command): string {
  const name = cmd.name();
  if (name === CLI_NAME) {
    return `${text}\n${style.dim('Documentation:')} ${style.accent(getDocsUrl())}\n`;
  }
  const slug = docsSlugForCommand(cmd);
  return `${text}\n${style.dim('Documentation:')} ${style.accent(docsCommandUrl(slug))}\n`;
}

/** Terminal colors for Commander built-in help (global and subcommands). */
export function configureCliHelp(program: Command): void {
  program.configureHelp({
    formatHelp(cmd: Command, helper: Help) {
      let raw = Help.prototype.formatHelp.call(helper, cmd, helper);
      if (cmd.name() === 'report') {
        raw = raw.replace(
          /^Usage:[^\n]*/m,
          `Usage: ${CLI_NAME} <command> [options] [--report-file <path>] [--report-format <json|text|csv>]`,
        );
      }
      const colored = colorizeHelpText(raw);
      const opts = program.opts<{ json?: boolean; silent?: boolean }>();
      if (Boolean(opts.json) || Boolean(opts.silent)) {
        return appendDocsFooter(colored, cmd);
      }
      const title = toolDisplayTitle(cmd);
      const subtitle = getTopicBannerSubtitle(cmd);
      return appendDocsFooter(`\n${header(title, { subtitle })}\n\n${colored}`, cmd);
    },
  });
}

export function colorizeHelpText(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let section: 'none' | 'arguments' | 'options' | 'commands' | 'global-options' = 'none';
  for (const line of lines) {
    if (line.startsWith('Usage:')) {
      out.push(styleUsageLine(line));
      continue;
    }
    if (SECTION_HEADER.test(line)) {
      if (line === 'Commands:') section = 'commands';
      else if (line === 'Options:') section = 'options';
      else if (line === 'Arguments:') section = 'arguments';
      else if (line === 'Global Options:') section = 'global-options';
      out.push(styleSectionHeader(line));
      continue;
    }
    if (line === '') section = 'none';
    const row = HELP_ROW.exec(line);
    if (row) {
      const [, indent, termRaw, gap, desc] = row;
      const term = termRaw.trimEnd();
      const looksLikeFlagOrCommand =
        /^-/.test(term) ||
        term.includes('|') ||
        /^\[[^\]]+\]/.test(term.trimStart()) ||
        (section === 'commands' && /^[a-z]/i.test(term.trimStart()));
      if (looksLikeFlagOrCommand) {
        out.push(`${indent}${styleTerm(term, section)}${gap}${styleDescription(desc)}`);
        continue;
      }
    }
    if (line === '') {
      out.push('');
      continue;
    }
    out.push(style.dim(line));
  }
  return out.join('\n');
}
