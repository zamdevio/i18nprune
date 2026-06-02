import { describe, it, expect } from 'vitest';
import { preprocessArgv } from '../index.js';

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
});
