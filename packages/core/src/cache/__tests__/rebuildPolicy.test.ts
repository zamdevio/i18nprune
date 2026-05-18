import { describe, expect, it } from 'vitest';
import { decideAnalysisRebuild } from '../rebuildPolicy.js';
import type { ClassifiedCacheFileDelta } from '../../types/cache/index.js';

const emptySrc = { added: [], changed: [], deleted: [] };

function classified(overrides: Partial<ClassifiedCacheFileDelta>): ClassifiedCacheFileDelta {
  return {
    src: emptySrc,
    sourceLocale: [],
    targetLocale: [],
    layoutChanged: false,
    filesIndexStatus: { kind: 'ok' },
    ...overrides,
  };
}

describe('decideAnalysisRebuild', () => {
  const partialConfig = { rebuild: 'partial' as const, fullRescanThresholdPercent: 40 };

  it('opts out when rebuild is full', () => {
    const d = decideAnalysisRebuild({
      config: { rebuild: 'full', fullRescanThresholdPercent: 40 },
      classified: classified({ src: { added: [], changed: ['a.ts'], deleted: [], } }),
      hasPrevious: true,
      trackedSrcCount: 10,
    });
    expect(d.strategy).toBe('full');
    expect(d.reason).toBe('config_rebuild_full');
  });

  it('partial when one src file changes under threshold', () => {
    const d = decideAnalysisRebuild({
      config: partialConfig,
      classified: classified({ src: { added: [], changed: ['a.ts'], deleted: [], } }),
      hasPrevious: true,
      trackedSrcCount: 100,
    });
    expect(d.strategy).toBe('partial');
    expect(d.reason).toBe('src_partial');
  });

  it('full when src delta exceeds threshold percent', () => {
    const d = decideAnalysisRebuild({
      config: partialConfig,
      classified: classified({
        src: { added: [], changed: ['a.ts', 'b.ts'], deleted: ['c.ts', 'd.ts'], },
      }),
      hasPrevious: true,
      trackedSrcCount: 10,
    });
    expect(d.strategy).toBe('full');
    expect(d.reason).toBe('src_threshold');
  });

  it('partial when a src file is deleted', () => {
    const d = decideAnalysisRebuild({
      config: partialConfig,
      classified: classified({ src: { added: [], changed: [], deleted: ['App.tsx'] } }),
      hasPrevious: true,
      trackedSrcCount: 100,
    });
    expect(d.strategy).toBe('partial');
    expect(d.reason).toBe('src_partial');
  });

  it('full when files index missing and no previous analysis', () => {
    const d = decideAnalysisRebuild({
      config: partialConfig,
      classified: classified({ filesIndexStatus: { kind: 'missing' } }),
      hasPrevious: false,
      trackedSrcCount: 0,
    });
    expect(d.strategy).toBe('full');
    expect(d.reason).toBe('files_index_missing');
  });

  it('full when files index unusable but project changed since analysis', () => {
    const d = decideAnalysisRebuild({
      config: partialConfig,
      classified: classified({ filesIndexStatus: { kind: 'missing' } }),
      hasPrevious: true,
      trackedSrcCount: 10,
    });
    expect(d.strategy).toBe('full');
    expect(d.reason).toBe('files_index_stale');
  });

  it('full when target locale changes (phase 1)', () => {
    const d = decideAnalysisRebuild({
      config: partialConfig,
      classified: classified({ targetLocale: ['fr.json'] }),
      hasPrevious: true,
      trackedSrcCount: 5,
    });
    expect(d.strategy).toBe('full');
    expect(d.reason).toBe('locale_or_non_src_changed');
  });
});
