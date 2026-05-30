import { describe, it, expect } from 'vitest';
import { preprocessArgv } from '../index.js';

function argv(...args: string[]): string[] {
  return ['node', '/bin/i18nprune', ...args];
}

describe('preprocessArgv', () => {
  it('rewrites -v to version subcommand when no command is present', () => {
    expect(preprocessArgv(argv('-v'))).toEqual(argv('version'));
  });

  it('rewrites --version with global flags before version', () => {
    expect(preprocessArgv(argv('-q', '--version'))).toEqual(argv('-q', 'version'));
  });

  it('rewrites --version --check to version --check', () => {
    expect(preprocessArgv(argv('--version', '--check'))).toEqual(argv('version', '--check'));
  });

  it('does not rewrite when a subcommand is already present', () => {
    expect(preprocessArgv(argv('doctor', '-v'))).toEqual(argv('doctor', '-v'));
  });

  it('maps langs positional alias to languages', () => {
    expect(preprocessArgv(argv('langs'))).toEqual(argv('languages'));
  });
});
