import {
  GROUP_SUBCOMMAND_ALIASES,
  POSITIONAL_COMMAND_ALIASES,
} from '@/argv/index.js';
import { getCommandInvocationPath } from '@/utils/cli/path.js';
import type { Command } from 'commander';

const HELP_ROW = /^(\s{2})(.+?)(\s{2,})(.*)$/;

/** Canonical command name → positional alias shown in help. */
function rootCommandShortAliases(): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const [short, canonical] of Object.entries(POSITIONAL_COMMAND_ALIASES)) {
    out[canonical] = short;
  }
  return out;
}

function normalizeCommandTermWithAlias(
  term: string,
  reverse: Readonly<Record<string, string>>,
): string {
  const pipeIdx = term.indexOf('|');
  if (pipeIdx !== -1) {
    const left = term.slice(0, pipeIdx);
    const right = term.slice(pipeIdx + 1);
    const spaceIdx = right.indexOf(' ');
    const alias = spaceIdx === -1 ? right : right.slice(0, spaceIdx);
    const rest = spaceIdx === -1 ? '' : right.slice(spaceIdx);
    return `${alias}, ${left}${rest}`;
  }
  const base = term.split(/\s/)[0] ?? term;
  const short = reverse[base];
  if (!short || term.startsWith(`${short},`)) return term;
  return term.replace(base, `${short}, ${base}`);
}

function injectCommandsSectionAliases(
  raw: string,
  reverse: Readonly<Record<string, string>>,
  stopAt: RegExp,
): string {
  const lines = raw.split('\n');
  let inCommands = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line === 'Commands:') {
      inCommands = true;
      continue;
    }
    if (inCommands && (line === '' || stopAt.test(line))) {
      inCommands = false;
    }
    if (!inCommands) continue;
    const row = HELP_ROW.exec(line);
    if (!row) continue;
    const [, indent, termRaw, gap, desc] = row;
    const term = termRaw.trimEnd();
    if (!/^[a-z]/i.test(term)) continue;
    const nextTerm = normalizeCommandTermWithAlias(term, reverse);
    if (nextTerm !== term) {
      lines[i] = `${indent}${nextTerm}${gap}${desc}`;
    }
  }
  return lines.join('\n');
}

/** Root program — top-level command aliases (`val, validate`). */
export function injectRootCommandAliases(raw: string): string {
  return injectCommandsSectionAliases(raw, rootCommandShortAliases(), /^Global Options:|^Options:/);
}

/** Group parents (`locales`, `share`, `kits`) — subcommand aliases (`ls, list`). */
export function injectGroupSubcommandAliases(raw: string, group: string): string {
  const reverse: Record<string, string> = {};
  const subs = GROUP_SUBCOMMAND_ALIASES[group];
  if (!subs) return raw;
  for (const [short, canonical] of Object.entries(subs)) {
    reverse[canonical] = short;
  }
  return injectCommandsSectionAliases(raw, reverse, /^Options:|^Global Options:/);
}

/** Inline command/subcommand aliases before help colorization. */
export function injectCommandAliasesIntoHelp(raw: string, cmd: Command, rootName: string): string {
  const path = getCommandInvocationPath(cmd, rootName);
  if (path === '' || cmd.name() === rootName) {
    return injectRootCommandAliases(raw);
  }
  if (path in GROUP_SUBCOMMAND_ALIASES) {
    return injectGroupSubcommandAliases(raw, path);
  }
  return raw;
}
