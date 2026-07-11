import { describe, expect, it } from 'vitest';
import {
  injectGroupSubcommandAliases,
  injectRootCommandAliases,
} from '../injectRootCommandAliases.js';

describe('injectRootCommandAliases', () => {
  it('prefixes mnemonic aliases on root Commands rows', () => {
    const raw = [
      'Commands:',
      '  validate               check keys',
      '  sync [options]         align locales',
      '  cleanup [options]      remove unused',
      '  languages|langs        list languages',
      '',
      'Global Options:',
    ].join('\n');
    const out = injectRootCommandAliases(raw);
    expect(out).toContain('val, validate');
    expect(out).toContain('sync [options]');
    expect(out).not.toContain('val, sync');
    expect(out).not.toContain('clean, cleanup');
    expect(out).toContain('langs, languages');
  });
});

describe('injectGroupSubcommandAliases', () => {
  it('prefixes subcommand aliases for kits and locales groups', () => {
    const kitsRaw = [
      'Commands:',
      '  identical [options]    report identical',
      '  pr [options]           pr markdown',
      '',
      'Options:',
    ].join('\n');
    expect(injectGroupSubcommandAliases(kitsRaw, 'kits')).toContain('id, identical');

    const locRaw = [
      'Commands:',
      '  list                   list files',
      '  delete [options]       delete locale',
      '',
      'Options:',
    ].join('\n');
    expect(injectGroupSubcommandAliases(locRaw, 'locales')).toContain('ls, list');
    expect(injectGroupSubcommandAliases(locRaw, 'locales')).toContain('rm, delete');
  });
});
