import { describe, expect, it } from 'vitest';
import { buildValidateHumanView } from '../human.js';

describe('buildValidateHumanView', () => {
  it('shapes dynamic and missing human previews', () => {
    const out = buildValidateHumanView({
      missing: ['a', 'b'],
      dynamicSites: [{ kind: 'non_literal', functionName: 't', preview: 't(k)', filePath: 'x.ts', line: 2 }],
      missingPreviewLimit: 1,
    });
    expect(out.dynamicWarning).toContain('non-literal key');
    expect(out.dynamicPreview).toHaveLength(0);
    expect(out.dynamicHiddenCount).toBe(0);
    expect(out.missingMessage).toContain('2 key(s)');
    expect(out.missingPreview).toEqual(['a']);
    expect(out.missingHiddenCount).toBe(1);
  });
});
