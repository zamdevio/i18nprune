import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { parseZipToSnapshot } from '../parseZip.js';

function tinyZipWithReadme(): Uint8Array {
  return zipSync({ 'README.md': strToU8('# hi\n') });
}

describe('parseZipToSnapshot', () => {
  it('builds snapshot and text map for a tiny text file', () => {
    const zip = tinyZipWithReadme();
    const { snapshot, textFiles } = parseZipToSnapshot('pid', 'phash', zip);
    expect(snapshot.projectId).toBe('pid');
    expect(snapshot.projectHash).toBe('phash');
    expect(snapshot.fileCount).toBe(1);
    expect(snapshot.textFileCount).toBe(1);
    expect(textFiles['README.md']).toBe('# hi\n');
    expect(snapshot.tree.length).toBeGreaterThan(0);
  });
});
