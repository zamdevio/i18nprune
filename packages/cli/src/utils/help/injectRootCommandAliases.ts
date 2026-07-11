import { POSITIONAL_COMMAND_ALIASES } from '@/argv/index.js';

const HELP_ROW = /^(\s{2})(.+?)(\s{2,})(.*)$/;

/** Prefer shortest positional alias per canonical command name. */
function preferredCommandShortAliases(): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const [short, canonical] of Object.entries(POSITIONAL_COMMAND_ALIASES)) {
    const prev = out[canonical];
    if (!prev || short.length < prev.length) out[canonical] = short;
  }
  return out;
}

function normalizeRootCommandTerm(term: string, reverse: Readonly<Record<string, string>>): string {
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

/**
 * Inlines positional command aliases into the root `Commands:` table (`v, validate` style).
 */
export function injectRootCommandAliases(raw: string): string {
  const reverse = preferredCommandShortAliases();
  const lines = raw.split('\n');
  let inCommands = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line === 'Commands:') {
      inCommands = true;
      continue;
    }
    if (inCommands && (line === '' || line === 'Global Options:' || line.startsWith('Options:'))) {
      inCommands = false;
    }
    if (!inCommands) continue;
    const row = HELP_ROW.exec(line);
    if (!row) continue;
    const [, indent, termRaw, gap, desc] = row;
    const term = termRaw.trimEnd();
    if (!/^[a-z]/i.test(term)) continue;
    const nextTerm = normalizeRootCommandTerm(term, reverse);
    if (nextTerm !== term) {
      lines[i] = `${indent}${nextTerm}${gap}${desc}`;
    }
  }
  return lines.join('\n');
}
