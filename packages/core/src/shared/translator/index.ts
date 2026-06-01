import { mask, restore, validateRestored } from '../placeholders/index.js';
import type { Translator } from '../../types/translator/index.js';
import type { TranslationProviderId } from '../../types/translator/providers.js';
import type { LeafDecision, TranslationResult } from '../../types/translator/result.js';
import { buildHeuristicLeafMeta } from './utils/metadata.js';
import {
  finalizeTranslationLeafMeta,
  mergeTranslationLeafMeta,
  unpackProviderTranslation,
  validateLeafTranslationString,
} from './utils/pipeline.js';
import { normalizeUnknownError } from '../errors/index.js';
import { issueCodeRepoDocPathForIssueCode } from '../docs/issueAnchors.js';
import {
  ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR,
  ISSUE_GENERATE_TRANSLATE_RATE_LIMITED,
} from '../constants/issueCodes.js';
import type { Issue } from '../../types/json/envelope/index.js';
import { classifyTranslateFailure } from '../../translator/policy/index.js';

const DEFAULT_DELAYS = [400, 900];

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export { localeJsonValueFromTranslation, validateLeafTranslationString } from './utils/pipeline.js';

/**
 * Placeholder-safe translate: mask → provider → restore → validate; merges **leaf metadata**
 * (provider-native + shared heuristic). Callers decide whether to **persist** structured JSON.
 */
export async function translateLeaf(
  provider: Translator,
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  options?: {
    onTranslated?: (sourceText: string, translatedText: string) => Promise<void> | void;
    /** Used for heuristic `source` tagging and tuning when the backend returns no scores. */
    providerId?: TranslationProviderId;
  },
): Promise<TranslationResult> {
  const { text, originals } = mask(sourceText);
  const providerId = options?.providerId ?? 'google';
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const raw = await provider.translate(text, sourceLang, targetLang);
      const unpacked = unpackProviderTranslation(raw);
      const normalized = validateLeafTranslationString(unpacked.text, 'translate');
      const restored = restore(normalized, originals);
      validateRestored(sourceText, restored, originals);
      const heuristic = buildHeuristicLeafMeta({
        sourceText,
        translatedText: restored,
        providerId,
      });
      const merged = mergeTranslationLeafMeta(heuristic, unpacked.patch);
      const decision: LeafDecision = merged.needsReview === true ? 'review' : 'translated';
      const leafMeta = finalizeTranslationLeafMeta(merged, decision);
      await options?.onTranslated?.(sourceText, restored);
      const attempts = attempt + 1;
      return {
        text: restored,
        leafMeta,
        decision,
        runtime: { attempts, retries: Math.max(0, attempts - 1) },
      };
    } catch (e) {
      lastErr = e;
      if (attempt < 2) await sleep(DEFAULT_DELAYS[attempt] ?? 500);
    }
  }

  const parseMyMemoryQuotaWait = (msg: string): string | null => {
    // Example:
    // "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY. NEXT AVAILABLE IN  01 HOURS 33 MINUTES 56 SECONDS ..."
    const m = msg.match(/NEXT AVAILABLE IN\s+(\d+)\s+HOURS\s+(\d+)\s+MINUTES\s+(\d+)\s+SECONDS/i);
    if (!m) return null;
    const h = Number.parseInt(m[1] ?? '', 10);
    const min = Number.parseInt(m[2] ?? '', 10);
    const s = Number.parseInt(m[3] ?? '', 10);
    if (![h, min, s].every((n) => Number.isFinite(n) && n >= 0)) return null;
    const parts = [h ? `${String(h)}h` : '', min ? `${String(min)}m` : '', `${String(s)}s`].filter(Boolean);
    return parts.join(' ');
  };
  const outcome = classifyTranslateFailure(lastErr);
  const issueCode =
    outcome === 'rate_limited' || outcome === 'quota_exceeded'
      ? ISSUE_GENERATE_TRANSLATE_RATE_LIMITED
      : outcome === 'transient_network' || outcome === 'provider_unavailable'
        ? ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR
        : undefined;

  const issues: Issue[] =
    issueCode !== undefined
      ? [
          {
            severity: 'error',
            code: issueCode,
            message:
              issueCode === ISSUE_GENERATE_TRANSLATE_RATE_LIMITED
                ? (() => {
                    const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
                    const wait = /MYMEMORY WARNING/i.test(msg) ? parseMyMemoryQuotaWait(msg) : null;
                    const waitHint = wait ? ` Wait time reported by MyMemory: ${wait}.` : '';
                    const limitsHint = /MYMEMORY WARNING/i.test(msg)
                      ? ' See MyMemory usage limits: https://mymemory.translated.net/doc/usagelimits.php.'
                      : '';
                    return `Translation failed: backend rate limited the request(s) (HTTP 429). Reduce --workers, wait, or switch provider.${waitHint}${limitsHint}`;
                  })()
                : 'Translation failed: network error talking to the translation backend. Check connectivity/DNS/proxy and retry.',
            docPath: issueCodeRepoDocPathForIssueCode(issueCode),
          },
        ]
      : [];

  // Throw as a structured I18nPruneError AND attach issues so `runGenerate` can surface them.
  const norm = normalizeUnknownError(lastErr, {
    when: 'Translation failed after retries',
    defaultCode: 'INTERNAL',
    ...(issueCode !== undefined ? { issueCode } : {}),
  });
  (norm as unknown as { issues?: Issue[] }).issues = issues;
  throw norm;
}
