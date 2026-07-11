import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import chalk from 'chalk';
import { configureStyleFromRun } from '@/utils/style/index.js';
import { formatKitsTerminalMarkdown } from '../terminalMarkdown.js';

describe('formatKitsTerminalMarkdown', () => {
  let isTTY = true;
  let savedChalkLevel: typeof chalk.level;

  beforeEach(() => {
    savedChalkLevel = chalk.level;
    chalk.level = 3;
    configureStyleFromRun({ noColor: false });
    isTTY = true;
    Object.defineProperty(process.stdout, 'isTTY', { configurable: true, get: () => isTTY });
  });

  afterEach(() => {
    chalk.level = savedChalkLevel;
  });

  it('dims blockquotes and docs lines on TTY', () => {
    const md = [
      '## i18nprune Audit',
      '- Missing literal keys: **12**',
      '> Dynamic sites are non-literal.',
      'Docs: https://docs.example/issues',
    ].join('\n');
    const out = formatKitsTerminalMarkdown(md, { json: false, noColor: false });
    expect(out).toContain('## i18nprune Audit');
    expect(out).toContain('- Missing literal keys: **12**');
    expect(out).toMatch(/\u001b\[2m> Dynamic sites/);
    expect(out).toMatch(/\u001b\[2mDocs: https:\/\/docs.example\/issues/);
  });

  it('dims sample row suffix while keeping [kind] primary', () => {
    const md = '- [template_partial] `src/foo.tsx:12` — `preview`';
    const out = formatKitsTerminalMarkdown(md, { json: false, noColor: false });
    expect(out.startsWith('- [template_partial]')).toBe(true);
    expect(out).toMatch(/\u001b\[2m `src\/foo.tsx:12`/);
  });

  it('returns plain markdown for file/json/noColor paths', () => {
    const md = '> note\nDocs: x';
    isTTY = true;
    expect(formatKitsTerminalMarkdown(md, { json: true, noColor: false })).toBe(md);
    expect(formatKitsTerminalMarkdown(md, { json: false, noColor: true })).toBe(md);
    isTTY = false;
    expect(formatKitsTerminalMarkdown(md, { json: false, noColor: false })).toBe(md);
  });
});
