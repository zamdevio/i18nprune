import { describe, expect, it } from 'vitest';

import { partitionTemplateHoles } from '../partition.js';

describe('partitionTemplateHoles', () => {
  it('classifies const-map identifiers separately from runtime holes', () => {
    const partition = partitionTemplateHoles('${M}.statuses.${data.status}', { M: 'orders' });
    expect(partition.constResolved).toEqual([
      { kind: 'const_resolved', expr: 'M', identifier: 'M', value: 'orders' },
    ]);
    expect(partition.runtime).toEqual([{ kind: 'runtime', expr: 'data.status' }]);
  });

  it('treats unknown simple identifiers as runtime', () => {
    const partition = partitionTemplateHoles('${NS}.nav.${navPage}', { NS: 'app' });
    expect(partition.constResolved.map((h) => h.identifier)).toEqual(['NS']);
    expect(partition.runtime.map((h) => h.expr)).toEqual(['navPage']);
  });

  it('treats quoted literal holes as runtime', () => {
    const partition = partitionTemplateHoles("${NS}.footer.${'copyright'}", { NS: 'app' });
    expect(partition.runtime.map((h) => h.expr)).toEqual(["'copyright'"]);
  });

  it('returns empty partitions when there are no holes', () => {
    const partition = partitionTemplateHoles('app.title', {});
    expect(partition.holes).toEqual([]);
    expect(partition.constResolved).toEqual([]);
    expect(partition.runtime).toEqual([]);
  });
});
