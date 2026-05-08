import { describe, expect, it } from 'vitest';
import { buildValidateReportView } from '../report.js';

describe('buildValidateReportView', () => {
  it('builds messages and capped previews', () => {
    const out = buildValidateReportView({
      missing: ['a', 'b'],
      dynamicSites: [
        { kind: 'non_literal', functionName: 't', preview: 't(foo)' },
        { kind: 'non_literal', functionName: 't', preview: 't(bar)' },
      ],
      keyObservations: [
        { kind: 'literal', resolvedKey: 'a', raw: 'a', span: { filePath: 'x.ts', line: 1 } },
        { kind: 'literal', resolvedKey: 'b', raw: 'b', span: { filePath: 'x.ts', line: 2 } },
      ],
      listLimit: 1,
    });
    expect(out.missingMessage).toContain('2 key(s)');
    expect(out.dynamicMessage).toContain('2 non-literal');
    expect(out.keyObservationsMessage).toContain('2 key observation');
    expect(out.missingPreview).toEqual(['a']);
    expect(out.dynamicPreview).toHaveLength(1);
    expect(out.keyObservationsPreview).toHaveLength(1);
  });
});
