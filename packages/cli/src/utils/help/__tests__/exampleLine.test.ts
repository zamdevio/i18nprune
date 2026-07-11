import { describe, expect, it } from 'vitest';
import { CLI_NAME } from '@/constants/cli.js';
import { styleExampleLine } from '@/utils/help/exampleLine.js';

describe('styleExampleLine', () => {
  it('includes binary, command, and flag tokens', () => {
    const out = styleExampleLine(`${CLI_NAME} sync --dry-run --target ar`);
    expect(out).toContain(CLI_NAME);
    expect(out).toContain('sync');
    expect(out).toContain('--dry-run');
    expect(out).toContain('ar');
  });
});
