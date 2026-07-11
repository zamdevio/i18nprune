import { describe, it, expect } from 'vitest';
import { preprocessArgv } from '../index.js';
import { lookupFlagAlias } from '../flagAliases.js';

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

  it('expands global -y, -n, -m flags', () => {
    expect(preprocessArgv(argv('init', '-y'))).toEqual(argv('init', '--yes'));
    expect(preprocessArgv(argv('sync', '-n', '--target', 'ar'))).toEqual(
      argv('sync', '--dry-run', '--target', 'ar'),
    );
    expect(preprocessArgv(argv('generate', '-m', '--target', 'ar'))).toEqual(
      argv('generate', '--metadata', '--target', 'ar'),
    );
  });

  it('expands new global logging and config short flags', () => {
    expect(preprocessArgv(argv('validate', '-ncl'))).toEqual(argv('validate', '--no-color'));
    expect(preprocessArgv(argv('validate', '-ld', 'locales'))).toEqual(
      argv('validate', '--locales-dir', 'locales'),
    );
    expect(preprocessArgv(argv('validate', '-cp', 'fast'))).toEqual(
      argv('validate', '--cache-profile', 'fast'),
    );
  });

  it('scopes -f to --force on generate and -fcs to --focus on kits', () => {
    expect(preprocessArgv(argv('generate', '-f'))).toEqual(argv('generate', '--force'));
    expect(preprocessArgv(argv('kits', 'honest', '-fcs', 'router'))).toEqual(
      argv('kits', 'honest', '--focus', 'router'),
    );
  });

  it('expands -chk, -flt, and -rch command flags', () => {
    expect(preprocessArgv(argv('version', '-chk'))).toEqual(argv('version', '--check'));
    expect(preprocessArgv(argv('languages', '-flt', 'arabic'))).toEqual(
      argv('languages', '--filter', 'arabic'),
    );
    expect(preprocessArgv(argv('init', '-rch'))).toEqual(argv('init', '--rich'));
  });

  it('expands generate and sync command-scoped flags', () => {
    expect(preprocessArgv(argv('generate', '-P', 'llm', '-R'))).toEqual(
      argv('generate', '--provider', 'llm', '--resume'),
    );
    expect(preprocessArgv(argv('sync', '-nrsl', '-sm'))).toEqual(
      argv('sync', '--no-repair-sentinel-leaks', '--strip-metadata'),
    );
  });
});

describe('lookupFlagAlias', () => {
  it('returns undefined for unknown shorts', () => {
    expect(lookupFlagAlias('-zzz', 'validate')).toBeUndefined();
  });
});
