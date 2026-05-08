import { describe, expect, it } from 'vitest';
import { replaceStartBeforePropertyKey } from '@/shared/patching/replaceConfigPatchingBlock.js';

describe('replaceStartBeforePropertyKey', () => {
  const idxOfPatchingKey = (s: string): number => /\bpatching\s*:/m.exec(s)!.index;

  it('strips whitespace-only indent before patching so snippet indent is sole authority', () => {
    const file = `{ a: 1,\n  patching: {\nb: true,\n},\n}`;
    const m = idxOfPatchingKey(file);
    expect(m).toBeGreaterThan(0);
    expect(replaceStartBeforePropertyKey(file, m)).toBe(file.lastIndexOf('\n', m - 1) + 1);
  });

  it('does not rewind when non-whitespace appears before patching on the line', () => {
    const file = `  foo patching: {}\n`;
    const m = /\bpatching\s*:/m.exec(file);
    expect(m?.index).toBeDefined();
    if (m?.index == null) return;
    expect(replaceStartBeforePropertyKey(file, m.index)).toBe(m.index);
  });

  it('handles patching at BOF column 0', () => {
    const file = `patching: {\n},\n`;
    const m = idxOfPatchingKey(file);
    expect(replaceStartBeforePropertyKey(file, m)).toBe(0);
  });
});
