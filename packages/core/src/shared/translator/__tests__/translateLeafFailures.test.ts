import { describe, expect, it } from 'vitest';
import { translateLeaf } from '../index.js';
import type { Translator } from '../../../types/translator/index.js';
import {
  ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR,
  ISSUE_GENERATE_TRANSLATE_RATE_LIMITED,
} from '../../constants/issueCodes.js';

describe('translateLeaf failure issue codes', () => {
  it('sets decision=review and mirrors needsReview=true when merged metadata requests review', async () => {
    const provider: Translator = {
      async translate() {
        return { text: 'hello', leafMeta: { needsReview: true } };
      },
    };
    const out = await translateLeaf(provider, 'hi', 'en', 'so', { providerId: 'google' });
    expect(out.decision).toBe('review');
    expect(out.leafMeta.needsReview).toBe(true);
  });

  it('sets decision=translated and needsReview=false on a clean translation', async () => {
    const provider: Translator = {
      async translate() {
        return { text: 'hola', leafMeta: { confidence: 0.9 } };
      },
    };
    const out = await translateLeaf(provider, 'hello', 'en', 'es', { providerId: 'google' });
    expect(out.decision).toBe('translated');
    expect(out.leafMeta.needsReview).toBe(false);
  });

  it('attaches rate limit issue for HTTP 429 errors', async () => {
    const provider: Translator = {
      async translate() {
        throw new Error(
          'MyMemory HTTP 429: MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY. NEXT AVAILABLE IN  01 HOURS 33 MINUTES 56 SECONDS VISIT HTTPS://MYMEMORY.TRANSLATED.NET/DOC/USAGELIMITS.PHP TO TRANSLATE MORE',
        );
      },
    };
    await expect(translateLeaf(provider, 'hi', 'en', 'so', { providerId: 'mymemory' })).rejects.toMatchObject({
      issues: [
        {
          code: ISSUE_GENERATE_TRANSLATE_RATE_LIMITED,
          severity: 'error',
          message: expect.stringContaining('Wait time reported by MyMemory: 1h 33m 56s.'),
        },
      ],
    });
  });

  it('attaches network issue for common errno codes', async () => {
    const e = new Error('fetch failed');
    (e as unknown as { code?: string }).code = 'ECONNRESET';
    const provider: Translator = {
      async translate() {
        throw e;
      },
    };
    await expect(translateLeaf(provider, 'hi', 'en', 'so', { providerId: 'mymemory' })).rejects.toMatchObject({
      issues: [{ code: ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR, severity: 'error' }],
    });
  });
});

