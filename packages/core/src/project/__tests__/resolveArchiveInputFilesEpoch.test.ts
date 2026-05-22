import { describe, expect, it } from 'vitest';
import { resolveArchiveInputFilesEpoch } from '../prepare/resolveArchiveInputFilesEpoch.js';

describe('resolveArchiveInputFilesEpoch', () => {
  it('returns a stable hex digest for zip text files', async () => {
    const epoch = await resolveArchiveInputFilesEpoch({
      'src/a.ts': 'export const x = 1;',
      'locales/en.json': '{"a":"A"}',
    });
    expect(epoch).toMatch(/^[a-f0-9]+$/);
    const again = await resolveArchiveInputFilesEpoch({
      'src/a.ts': 'export const x = 1;',
      'locales/en.json': '{"a":"A"}',
    });
    expect(again).toBe(epoch);
  });

  it('changes when file content changes', async () => {
    const a = await resolveArchiveInputFilesEpoch({ 'locales/en.json': '{"a":"A"}' });
    const b = await resolveArchiveInputFilesEpoch({ 'locales/en.json': '{"a":"B"}' });
    expect(a).not.toBe(b);
  });
});
