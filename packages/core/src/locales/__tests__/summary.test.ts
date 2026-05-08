import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { buildLocaleListRows } from '../summary.js';

describe('buildLocaleListRows', () => {
  const rt = createNodeRuntimeAdapters();

  it('builds rows with leaf counts and source-identical counts', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-locale-summary-'));
    try {
      const sourcePath = path.join(dir, 'en.json');
      fs.writeFileSync(sourcePath, JSON.stringify({ a: { b: 'x' } }));
      fs.writeFileSync(path.join(dir, 'fr.json'), JSON.stringify({ a: { b: 'x' } }));
      const rows = buildLocaleListRows(rt, dir, ['fr.json', 'en.json'], sourcePath);
      expect(rows.map((r) => r.code).sort()).toEqual(['en', 'fr']);
      const fr = rows.find((r) => r.code === 'fr');
      expect(fr?.englishIdenticalLeafCount).toBe(1);
      const en = rows.find((r) => r.code === 'en');
      expect(en?.isSourceLocale).toBe(true);
      expect(en?.englishIdenticalLeafCount).toBe(null);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
