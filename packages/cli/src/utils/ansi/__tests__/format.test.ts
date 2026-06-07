import { describe, expect, it } from 'vitest';
import { cacheLine, line, scanLine, stripAnsiVisible, tipLine } from '@/utils/ansi/index.js';
import { configureStyleFromRun } from '@/utils/style/index.js';

describe('logger line format flags', () => {
  it('keeps default prefix and channel tags', () => {
    const out = stripAnsiVisible(line('info', 'hello'));
    expect(out).toBe('[i18nprune] [info] hello');
  });

  it('--no-log-prefix drops app prefix', () => {
    const out = stripAnsiVisible(line('warn', 'hello', { noLogPrefix: true }));
    expect(out).toBe('[warn] hello');
    expect(out).not.toContain('[i18nprune]');
  });

  it('--no-log-channel drops channel tags', () => {
    const out = stripAnsiVisible(tipLine('hint', { noLogChannel: true }));
    expect(out).toBe('[i18nprune] hint');
    expect(out).not.toMatch(/\[tip\]/);
  });

  it('combines no prefix and no channel to message only', () => {
    const fmt = { noLogPrefix: true, noLogChannel: true };
    expect(stripAnsiVisible(line('error', 'boom', fmt))).toBe('boom');
    expect(stripAnsiVisible(scanLine('skip', fmt))).toBe('skip');
    expect(stripAnsiVisible(cacheLine('hit', fmt))).toBe('hit');
  });
});

describe('noColor style wiring', () => {
  it('NO_COLOR-style plain output has no ANSI escapes', () => {
    configureStyleFromRun({ noColor: true });
    const out = line('info', 'plain');
    expect(out).toBe('[i18nprune] [info] plain');
    expect(out).not.toMatch(/\x1b\[/);
    configureStyleFromRun({ noColor: false });
  });
});
