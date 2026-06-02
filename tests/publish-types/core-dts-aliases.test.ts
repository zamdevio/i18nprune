import { describe, it } from 'vitest';
import { runCoreDtsTests } from '../../scripts/dts/fix-core-dts.mjs';

describe('publish core.d.ts namespace aliases', () => {
  it('detects and sanitizes invalid typeof aliases; dist/core.d.ts is clean after cli:build', () => {
    runCoreDtsTests();
  });
});
