import { describe, it, expect } from 'vitest';
import { formatGlobalInstallHintLine } from '../installHint.js';

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

describe('formatGlobalInstallHintLine', () => {
  it('includes pnpm, npm, and or in one line', () => {
    const plain = stripAnsi(formatGlobalInstallHintLine());
    expect(plain).toBe(
      'pnpm add -g i18nprune@latest or npm install -g i18nprune@latest',
    );
  });
});
