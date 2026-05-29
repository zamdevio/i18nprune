import { describe, expect, it } from 'vitest';
import { listResumeTranslationJobs } from '../localeTranslate.js';
import { resolveReferenceConfig } from '../../shared/reference/resolveConfig.js';
import type { TranslationSurfaceLeaf } from '../../types/locales/leaves/translationSurface.js';

describe('generate --resume with missing target locale file', () => {
  it('seeds stale jobs from source map when target JSON is empty', () => {
    const sourceMap = new Map([
      ['app.title', 'Hello'],
      ['app.cta', 'Get started'],
    ]);
    const tLeaves: TranslationSurfaceLeaf[] = Array.from(sourceMap.entries()).map(([path, value]) => ({
      path,
      value,
      shape: 'legacy_string',
      confidence: null,
      needsReview: null,
    }));
    const eff = resolveReferenceConfig('generate', {});
    const { jobs, dryRunCandidateCount } = listResumeTranslationJobs({
      tLeaves,
      next: {},
      sourceMap,
      refCtx: { uncertainPrefixes: [] },
      eff,
      dryRun: false,
    });
    expect(jobs).toHaveLength(2);
    expect(jobs.map((j) => j.path).sort()).toEqual(['app.cta', 'app.title']);
    expect(dryRunCandidateCount).toBe(0);
  });

  it('dry-run counts source-seeded leaves as resume candidates', () => {
    const sourceMap = new Map([['k', 'source text']]);
    const tLeaves: TranslationSurfaceLeaf[] = [
      {
        path: 'k',
        value: 'source text',
        shape: 'legacy_string',
        confidence: null,
        needsReview: null,
      },
    ];
    const eff = resolveReferenceConfig('generate', {});
    const { jobs, dryRunCandidateCount } = listResumeTranslationJobs({
      tLeaves,
      next: {},
      sourceMap,
      refCtx: { uncertainPrefixes: [] },
      eff,
      dryRun: true,
    });
    expect(jobs).toHaveLength(0);
    expect(dryRunCandidateCount).toBe(1);
  });
});
