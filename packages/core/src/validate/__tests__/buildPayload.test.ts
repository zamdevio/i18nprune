import { describe, expect, it } from 'vitest';
import type { DynamicKeySite } from '../../types/extractor/dynamic/index.js';
import type { KeyObservation } from '../../types/extractor/keySites/index.js';
import { buildValidateScanPayload } from '../buildPayload.js';

const literal = (key: string): KeyObservation => ({
  kind: 'literal',
  resolvedKey: key,
  raw: key,
  span: { line: 1, filePath: '/a.ts' },
});

const dynamic = (n: number): DynamicKeySite => ({
  kind: 'non_literal',
  functionName: 't',
  preview: String(n),
});

describe('buildValidateScanPayload', () => {
  it('computes missing keys', () => {
    const payload = buildValidateScanPayload({
      sourceLocaleJson: {},
      resolvedKeys: new Set(['a.b']),
      keyObservations: [],
      dynamicSites: [],
    });
    expect(payload.missing).toEqual(['a.b']);
    expect(payload.count).toBe(0);
  });

  it('includes key observation and dynamic counts in payload', () => {
    const keyObservations: KeyObservation[] = Array.from({ length: 400 }, (_, i) => literal(`k.${i}`));
    const dynamicSites: DynamicKeySite[] = Array.from({ length: 250 }, (_, i) => dynamic(i));
    const payload = buildValidateScanPayload({
      sourceLocaleJson: { x: 'y' },
      resolvedKeys: new Set(),
      keyObservations,
      dynamicSites,
    });
    expect(payload.dynamic).toEqual({ count: 250, active: 250, commented: 0 });
    expect(payload.keyObservations).toEqual({ count: 400 });
    expect(payload.count).toBe(400);
  });
});

