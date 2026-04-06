import chalk from 'chalk';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { styleCommandHelpTerm } from '@/utils/help/term.js';

describe('styleCommandHelpTerm', () => {
  let savedLevel: typeof chalk.level;
  beforeEach(() => {
    savedLevel = chalk.level;
    chalk.level = 3;
  });
  afterEach(() => {
    chalk.level = savedLevel;
  });

  it('styles bare subcommand name green (bold)', () => {
    const out = styleCommandHelpTerm('validate');
    expect(out).toContain('validate');
    expect(out).not.toContain('[options]');
  });

  it('dims bracket segments after the command name', () => {
    const out = styleCommandHelpTerm('sync [options]');
    expect(out).toMatch(/sync/);
    expect(out).toContain('\x1b[2m');
    expect(out).toContain('[options]');
  });

  it('dims multiple bracket groups', () => {
    const out = styleCommandHelpTerm('help [command]');
    expect(out).toContain('help');
    expect(out).toContain('[command]');
  });
});
