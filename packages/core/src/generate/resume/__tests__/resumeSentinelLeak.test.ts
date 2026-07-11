import { describe, expect, it, vi } from 'vitest';
import { listResumeTranslationJobs, translateResumeCandidateLeaves } from '../../localeTranslate.js';
import { isResumeCandidateLeaf } from '../../resume/eligibleResumeLeaves.js';
import { resolveReferenceConfig } from '../../../shared/reference/resolveConfig.js';
import type { TranslationSurfaceLeaf } from '../../../types/locales/leaves/translationSurface.js';

const eff = resolveReferenceConfig('generate', {});

describe('generate --resume with placeholder sentinel leaks', () => {
  it('treats sentinel leaks as candidates even on preserve paths', () => {
    expect(
      isResumeCandidateLeaf({
        leaf: {
          path: 'seo.titleTemplate',
          value: '__ I18NPRUNE_0 __ · __ I18NPRUNE_1 __',
          shape: 'legacy_string',
          confidence: null,
          needsReview: null,
        },
        sourceMap: new Map([['seo.titleTemplate', '{{pageTitle}} · {{siteName}}']]),
        refCtx: { uncertainPrefixes: [] },
        eff,
        preserve: { copyKeys: ['seo.titleTemplate'] },
      }),
    ).toBe(true);
  });

  it('queues translate jobs for leaked prose using source text', () => {
    const tLeaves: TranslationSurfaceLeaf[] = [
      {
        path: 'greeting',
        value: '__ I18NPRUNE_0 __',
        shape: 'legacy_string',
        confidence: null,
        needsReview: null,
      },
    ];
    const sourceMap = new Map([['greeting', 'Hello {{who}}']]);
    const { jobs } = listResumeTranslationJobs({
      tLeaves,
      next: { greeting: '__ I18NPRUNE_0 __' },
      sourceMap,
      refCtx: { uncertainPrefixes: [] },
      eff,
      dryRun: false,
    });
    expect(jobs).toEqual([{ leafIndex: 0, path: 'greeting', value: 'Hello {{who}}' }]);
  });

  it('placeholder_copy leaked placeholder-only leaves without MT', async () => {
    const tLeaves: TranslationSurfaceLeaf[] = [
      {
        path: 'meta',
        value: '__ I18NPRUNE_0 __ · __ I18NPRUNE_1 __',
        shape: 'legacy_string',
        confidence: null,
        needsReview: null,
      },
    ];
    const sourceMap = new Map([['meta', '{{who}} · {{status}}']]);
    const translate = vi.fn(async (text: string) => text);
    const out = await translateResumeCandidateLeaves({
      tLeaves,
      next: { meta: '__ I18NPRUNE_0 __ · __ I18NPRUNE_1 __' },
      sourceMap,
      refCtx: { uncertainPrefixes: [] },
      eff,
      provider: { translate },
      providerId: 'google',
      persistStructuredLeafMetadata: false,
      target: 'ar',
      dryRun: false,
      tickProgress: () => {},
    });
    expect(translate).not.toHaveBeenCalled();
    expect(out.next).toEqual({ meta: '{{who}} · {{status}}' });
    expect(out.changed).toBe(1);
  });

  it('translates leaked prose leaves on resume', async () => {
    const tLeaves: TranslationSurfaceLeaf[] = [
      {
        path: 'greeting',
        value: '__ I18NPRUNE_0 __',
        shape: 'legacy_string',
        confidence: null,
        needsReview: null,
      },
    ];
    const sourceMap = new Map([['greeting', 'Hello {{who}}']]);
    const translate = vi.fn(async (text: string) => `${text}-ar`);
    const out = await translateResumeCandidateLeaves({
      tLeaves,
      next: { greeting: '__ I18NPRUNE_0 __' },
      sourceMap,
      refCtx: { uncertainPrefixes: [] },
      eff,
      provider: { translate },
      providerId: 'google',
      persistStructuredLeafMetadata: false,
      target: 'ar',
      dryRun: false,
      tickProgress: () => {},
    });
    expect(translate).toHaveBeenCalledOnce();
    expect(translate.mock.calls[0]?.[0]).toContain('Hello');
    expect(out.next).toEqual({ greeting: 'Hello {{who}}-ar' });
  });
});
