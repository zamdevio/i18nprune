import { Help } from 'commander';
import type { Command } from 'commander';
import { CLI_NAME } from '@/constants/cli.js';
import { getTopicBannerSubtitle, toolDisplayTitle } from '@/utils/cli/banner.js';
import { docsCommandUrl, getDocsUrl } from '@i18nprune/core';
import { docsSlugForCommand } from '@/utils/cli/docsSlug.js';
import { header } from '@/utils/ansi/index.js';
import { formatCommandHelpExtras } from '@/utils/help/commandHelp.js';
import { injectRootCommandAliases } from '@/utils/help/injectRootCommandAliases.js';
import { styleExampleLine } from '@/utils/help/exampleLine.js';
import { styleCommandHelpTerm } from '@/utils/help/term.js';
import { formatWorkflowAppendix } from '@/utils/help/workflowAppendix.js';
import { style } from '@/utils/style/index.js';
import type { HelpColorizeSection } from '@/types/help/index.js';

const SECTION_HEADER =
  /^(Options|Commands|Arguments|Global Options|Workflows|Examples|Related|Notes):$/;
const HELP_ROW = /^(\s{2})(.+?)(\s{2,})(.*)$/;
const DEFAULT_NOTE = /\(default:[^)]+\)/g;

/**
 * Hooks Commander’s help renderer (global + subcommands). Kept as **`configureCliHelp`** (not a `help()` runner) — see `docs/commands/README.md`.
 */
export function configureCliHelp(program: Command): void {
  program.configureHelp({
    formatHelp(cmd: Command, helper: Help) {
      const raw = Help.prototype.formatHelp.call(helper, cmd, helper);
      const opts = program.opts<{ json?: boolean; silent?: boolean }>();
      const isRoot = cmd.parent === undefined || cmd.name() === CLI_NAME;
      const withAliases = isRoot ? injectRootCommandAliases(raw) : raw;
      const extras = formatCommandHelpExtras(cmd, CLI_NAME);
      const colored = colorizeHelpText(extras ? `${withAliases}${extras}` : withAliases);
      let body = colored;
      if (isRoot && !opts.json && !opts.silent) {
        body = `${colored}${formatWorkflowAppendix()}`;
      }
      if (Boolean(opts.json) || Boolean(opts.silent)) {
        return appendDocsFooter(body, cmd);
      }
      const title = toolDisplayTitle(cmd);
      const subtitle = getTopicBannerSubtitle(cmd);
      return appendDocsFooter(`\n${header(title, { subtitle })}\n\n${body}`, cmd);
    },
  });
}

export function colorizeHelpText(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let section: HelpColorizeSection = 'none';
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
      else if (line === 'Workflows:') section = 'workflows';
      else if (line === 'Examples:') section = 'examples';
      else if (line === 'Related:') section = 'related';
      else if (line === 'Notes:') section = 'notes';
      out.push(styleSectionHeader(line));
      continue;
    }
    if (line === '') {
      section = 'none';
      out.push('');
      continue;
    }
    if (section === 'workflows' && /^\s{2}\S/.test(line)) {
      out.push(`  ${style.dim(line.trim())}`);
      continue;
    }
    if (section === 'examples' && /^\s{2}\S/.test(line)) {
      out.push(styleExampleLine(line.trim()));
      continue;
    }
    if (section === 'related' && /^\s{2}\S/.test(line)) {
      const parts = line.trim().split(/\s+·\s+/);
      const styled = parts.map((part) => styleCommandHelpTerm(part.trim())).join(style.dim('  ·  '));
      out.push(`  ${styled}`);
      continue;
    }
    if (section === 'notes' && /^\s{2}\S/.test(line)) {
      out.push(`  ${style.dim(line.trim())}`);
      continue;
    }
    const row = HELP_ROW.exec(line);
    if (row) {
      const [, indent, termRaw, gap, desc] = row;
      const term = termRaw.trimEnd();
      const looksLikeFlagOrCommand =
        /^-/.test(term) ||
        term.includes('|') ||
        term.includes(',') ||
        /^\[[^\]]+\]/.test(term.trimStart()) ||
        (section === 'commands' && /^[a-z]/i.test(term.trimStart()));
      if (looksLikeFlagOrCommand) {
        out.push(`${indent}${styleTerm(term, section)}${gap}${styleDescription(desc)}`);
        continue;
      }
    }
    out.push(styleDescription(line));
  }
  return out.join('\n');
}

function styleUsageLine(line: string): string {
  const rest = line.slice('Usage:'.length).trimStart();
  const m = new RegExp(`^(${CLI_NAME})(\\s+[\\s\\S]*)?$`).exec(rest);
  if (!m) {
    return `${style.bold(style.magenta('Usage:'))} ${style.bold(style.accent(rest))}`;
  }
  const tail = m[2] ?? '';
  return `${style.bold(style.magenta('Usage:'))} ${style.bold(style.brand(CLI_NAME))}${style.bold(style.accent(tail))}`;
}

function styleSectionHeader(line: string): string {
  return style.bold(style.magenta(line));
}

function styleTerm(term: string, section: HelpColorizeSection): string {
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
  if (section === 'commands') {
    const aliasComma = /^([\w-]+),\s*(.+)$/.exec(term.trim());
    if (aliasComma) {
      return `${style.accent(aliasComma[1]!)}${style.dim(', ')}${styleCommandHelpTerm(aliasComma[2]!)}`;
    }
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
