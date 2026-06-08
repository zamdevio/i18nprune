import { describe, expect, it } from 'vitest';

import { buildConstStringMap } from '../build.js';
import { analyzeTemplateCall } from '../../shared/templateAnalysis.js';

describe('buildConstStringMap (E.2)', () => {
  it('includes simple let bindings with string literals', () => {
    const map = buildConstStringMap("let NS = 'pages.app';");
    expect(map.NS).toBe('pages.app');
  });

  it('includes export const bindings', () => {
    const map = buildConstStringMap("export const NS = 'app';");
    expect(map.NS).toBe('app');
  });

  it('drops identifiers that are reassigned later in the file', () => {
    const map = buildConstStringMap("const NS = 'a';\nNS = 'b';");
    expect(map.NS).toBeUndefined();
  });

  it('keeps block-scoped const maps per file (last declaration wins in scan order)', () => {
    const text = `
function a() {
  const NS = 'inner';
  return NS;
}
const NS = 'outer';
`;
    const map = buildConstStringMap(text);
    expect(map.NS).toBe('outer');
  });

  it('does not treat navPage let as const-only fold when file uses let for runtime locals', () => {
    const text = `
const NS = 'app';
let navPage = 'about';
t(\`\${NS}.nav.\${navPage}\`);
`;
    const map = buildConstStringMap(text);
    expect(map).toEqual({ NS: 'app', navPage: 'about' });
    const analysis = analyzeTemplateCall('${NS}.nav.${navPage}', map);
    expect(analysis.classification).toBe('fully_resolved');
  });
});
