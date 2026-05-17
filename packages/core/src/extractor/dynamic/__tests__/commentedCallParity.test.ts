import { describe, expect, it } from 'vitest';
import { findDynamicKeySitesInJavascriptFile } from '../providers/javascript.js';

const FILE = 'app.tsx';

describe('commented-call parity (dynamic / per-file)', () => {
  it('marks non-literal calls inside line comments as kind commented with isCommented', () => {
    const text = `export const x = 1;\n// t(maybeDynamic);\n`;
    const sites = findDynamicKeySitesInJavascriptFile(text, ['t'], FILE);
    expect(sites).toHaveLength(1);
    expect(sites[0]).toMatchObject({
      kind: 'commented',
      functionName: 't',
      isCommented: true,
      filePath: FILE,
    });
  });

  it('marks non-literal calls inside block comments as commented', () => {
    const text = `const a = 1;\n/* t(fromBlock) */\n`;
    const sites = findDynamicKeySitesInJavascriptFile(text, ['t'], FILE);
    expect(sites).toHaveLength(1);
    expect(sites[0]!.kind).toBe('commented');
    expect(sites[0]!.isCommented).toBe(true);
  });

  it('does not emit dynamic sites for commented literal-string calls (skipped as static in raw scan)', () => {
    const text = `// t('would.be.static')\n`;
    const sites = findDynamicKeySitesInJavascriptFile(text, ['t'], FILE);
    expect(sites).toHaveLength(0);
  });

  it('does not emit sites for prose-like first args even in comments (C.1.3 filter)', () => {
    const text = `// t (or vice versa)\n`;
    expect(findDynamicKeySitesInJavascriptFile(text, ['t'], FILE)).toHaveLength(0);
  });

  it('keeps active (non-comment) non_literal separate from commented sibling', () => {
    const text = `t(activeId);\n// t(onlyInComment);\n`;
    const sites = findDynamicKeySitesInJavascriptFile(text, ['t'], FILE);
    expect(sites).toHaveLength(2);
    const active = sites.find((s) => s.preview.includes('activeId'));
    const commented = sites.find((s) => s.preview.includes('onlyInComment'));
    expect(active?.kind).toBe('non_literal');
    expect(active?.isCommented).toBe(false);
    expect(commented?.kind).toBe('commented');
    expect(commented?.isCommented).toBe(true);
  });

  it('classifies commented template interpolation as commented (loses sub-kind in overlay)', () => {
    const text = '// t(`prefix.${unknown}`)\n';
    const sites = findDynamicKeySitesInJavascriptFile(text, ['t'], FILE);
    expect(sites).toHaveLength(1);
    expect(sites[0]!.kind).toBe('commented');
    expect(sites[0]!.isCommented).toBe(true);
  });
});
