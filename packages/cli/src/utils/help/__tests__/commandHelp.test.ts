import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { colorizeHelpText } from '@/commands/help/run.js';
import { CLI_NAME } from '@/constants/cli.js';
import { formatCommandHelpExtras } from '@/utils/help/commandHelp.js';
import { formatWorkflowAppendix } from '@/utils/help/workflowAppendix.js';

describe('formatCommandHelpExtras', () => {
  it('returns Examples and Related for validate', () => {
    const program = new Command(CLI_NAME);
    program.command('validate').description('test');
    const validate = program.commands.find((c) => c.name() === 'validate')!;
    const raw = formatCommandHelpExtras(validate, CLI_NAME);
    expect(raw).toContain('Examples:');
    expect(raw).toContain(`${CLI_NAME} validate -j`);
    expect(raw).toContain('Related:');
    expect(raw).toContain('sync  ·  generate');
  });

  it('returns nested path extras for kits identical', () => {
    const program = new Command(CLI_NAME);
    const kits = program.command('kits');
    kits.command('identical').description('test');
    const identical = kits.commands.find((c) => c.name() === 'identical')!;
    const raw = formatCommandHelpExtras(identical, CLI_NAME);
    expect(raw).toContain('kits identical -t ar');
    expect(raw).toContain('Notes:');
    expect(raw).toContain('-T, --top');
  });

  it('returns group workflows for locales', () => {
    const program = new Command(CLI_NAME);
    program.command('locales').description('test');
    const locales = program.commands.find((c) => c.name() === 'locales')!;
    const raw = formatCommandHelpExtras(locales, CLI_NAME);
    expect(raw).toContain('Workflows:');
    expect(raw).toContain('locales list');
  });
});

describe('formatWorkflowAppendix', () => {
  it('includes sentinel leak workflow line', () => {
    expect(formatWorkflowAppendix()).toContain('Fix MT sentinel leaks');
  });
});

describe('colorizeHelpText', () => {
  it('styles Examples and Related sections', () => {
    const raw = [
      'Examples:',
      '  i18nprune validate',
      '',
      'Related:',
      '  sync  ·  generate',
    ].join('\n');
    const out = colorizeHelpText(raw);
    expect(out).toContain('Examples:');
    expect(out).toContain('Related:');
    expect(out).toContain('i18nprune validate');
    expect(out).toContain('sync');
    expect(out).toContain('generate');
  });
});
