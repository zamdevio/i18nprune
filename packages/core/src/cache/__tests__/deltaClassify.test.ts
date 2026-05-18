import { describe, expect, it } from 'vitest';
import { classifyCacheFileDelta } from '../deltaClassify.js';

describe('classifyCacheFileDelta', () => {
  const layout = {
    mode: 'flat_file' as const,
    structure: 'locale_file' as const,
    directory: 'locales',
    source: 'locales/en.json',
  };

  it('routes src and locale paths into separate buckets', () => {
    const classified = classifyCacheFileDelta({
      delta: {
        added: ['main.ts'],
        changed: ['fr.json'],
        deleted: [],
        unchanged: ['en.json'],
      },
      currentSrcFileKeys: new Set(['main.ts', 'util.ts']),
      baselineSrcFileKeys: new Set(['util.ts']),
      currentLocaleSegmentKeys: new Set(['en.json', 'fr.json']),
      baselineLocaleSegmentKeys: new Set(['en.json']),
      sourceLocaleSegmentKey: 'en.json',
      currentLayout: layout,
      filesIndexStatus: { kind: 'ok' },
    });
    expect(classified.src.added).toEqual(['main.ts']);
    expect(classified.targetLocale).toEqual(['fr.json']);
    expect(classified.sourceLocale).toEqual([]);
    expect(classified.layoutChanged).toBe(true);
  });

  it('classifies deleted src files using baseline keys', () => {
    const classified = classifyCacheFileDelta({
      delta: { added: [], changed: [], deleted: ['App.tsx'], unchanged: [] },
      currentSrcFileKeys: new Set(['other.ts']),
      baselineSrcFileKeys: new Set(['App.tsx', 'other.ts']),
      currentLocaleSegmentKeys: new Set(),
      baselineLocaleSegmentKeys: new Set(),
      sourceLocaleSegmentKey: 'en.json',
      previousLayout: layout,
      currentLayout: layout,
      filesIndexStatus: { kind: 'ok' },
    });
    expect(classified.src.deleted).toEqual(['App.tsx']);
    expect(classified.layoutChanged).toBe(false);
  });

  it('does not treat missing files index as layout change', () => {
    const classified = classifyCacheFileDelta({
      delta: { added: ['main.ts'], changed: [], deleted: [], unchanged: [] },
      currentSrcFileKeys: new Set(['main.ts']),
      baselineSrcFileKeys: new Set(),
      currentLocaleSegmentKeys: new Set(),
      baselineLocaleSegmentKeys: new Set(),
      sourceLocaleSegmentKey: 'en.json',
      currentLayout: layout,
      filesIndexStatus: { kind: 'missing' },
    });
    expect(classified.layoutChanged).toBe(false);
  });

  it('detects source locale segment changes', () => {
    const classified = classifyCacheFileDelta({
      delta: { added: [], changed: ['en.json'], deleted: [], unchanged: [] },
      currentSrcFileKeys: new Set(['main.ts']),
      baselineSrcFileKeys: new Set(['main.ts']),
      currentLocaleSegmentKeys: new Set(['en.json', 'fr.json']),
      baselineLocaleSegmentKeys: new Set(['en.json', 'fr.json']),
      sourceLocaleSegmentKey: 'en.json',
      previousLayout: layout,
      currentLayout: layout,
      filesIndexStatus: { kind: 'ok' },
    });
    expect(classified.sourceLocale).toEqual(['en.json']);
    expect(classified.layoutChanged).toBe(false);
  });
});
