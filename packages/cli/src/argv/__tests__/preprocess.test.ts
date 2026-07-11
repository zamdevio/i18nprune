import { describe, it, expect } from 'vitest';
import { preprocessArgv, resolveHelpTopicToken } from '../index.js';

function argv(...args: string[]): string[] {
  return ['node', '/bin/i18nprune', ...args];
}

describe('preprocessArgv', () => {
  it('rewrites -V to version subcommand when no command is present', () => {
    expect(preprocessArgv(argv('-V'))).toEqual(argv('version'));
  });

  it('rewrites -V --check to version --check', () => {
    expect(preprocessArgv(argv('-V', '--check'))).toEqual(argv('version', '--check'));
  });

  it('does not rewrite -v (reserved for command-level verbose aliases)', () => {
    expect(preprocessArgv(argv('-v'))).toEqual(argv('-v'));
  });

  it('does not rewrite when a subcommand is already present', () => {
    expect(preprocessArgv(argv('doctor', '-v'))).toEqual(argv('doctor', '-v'));
  });

  it('does not rewrite -V when a subcommand is already present', () => {
    expect(preprocessArgv(argv('doctor', '-V'))).toEqual(argv('doctor', '-V'));
  });

  it('maps langs positional alias to languages', () => {
    expect(preprocessArgv(argv('langs'))).toEqual(argv('languages'));
  });

  it('maps top-level positional aliases', () => {
    expect(preprocessArgv(argv('v'))).toEqual(argv('validate'));
    expect(preprocessArgv(argv('g', '--metadata', '--target', 'ar', '-n'))).toEqual(
      argv('generate', '--metadata', '--target', 'ar', '--dry-run'),
    );
    expect(preprocessArgv(argv('cfg', '-j'))).toEqual(argv('config', '--json'));
    expect(preprocessArgv(argv('loc', 'ls'))).toEqual(argv('locales', 'list'));
  });

  it('maps share subcommand aliases', () => {
    expect(preprocessArgv(argv('share', 'up', '--project'))).toEqual(
      argv('share', 'upload', '--project'),
    );
  });

  it('expands global -y, -n, and -m flags', () => {
    expect(preprocessArgv(argv('init', '-y'))).toEqual(argv('init', '--yes'));
    expect(preprocessArgv(argv('sync', '-n', '--target', 'ar'))).toEqual(
      argv('sync', '--dry-run', '--target', 'ar'),
    );
    expect(preprocessArgv(argv('generate', '-m', '--target', 'ar'))).toEqual(
      argv('generate', '--metadata', '--target', 'ar'),
    );
  });
});

describe('resolveHelpTopicToken', () => {
  it('resolves top-level and group subcommand aliases', () => {
    expect(resolveHelpTopicToken(null, 'loc')).toBe('locales');
    expect(resolveHelpTopicToken('locales', 'dyn')).toBe('dynamic');
    expect(resolveHelpTopicToken('share', 'up')).toBe('upload');
  });
});
