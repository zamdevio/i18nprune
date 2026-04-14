import { PROJECT_REPORT_KIND, REPORT_INLINE_PAYLOAD_PLACEHOLDER } from '../../constants/env.js';
import type { ProjectReportDocument } from '../../types/index.js';
import { MOCK_PROJECT_REPORT } from '../mock/index.js';
import type { PayloadLoadResult } from './validate.js';
import { validatePayloadString } from './validate.js';

export type { PayloadErrorKind, PayloadLoadResult } from './validate.js';
export { validatePayloadString } from './validate.js';

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function looksLikeReport(x: unknown): x is ProjectReportDocument {
  if (!isRecord(x)) return false;
  return x.kind === PROJECT_REPORT_KIND && typeof x.schemaVersion === 'number' && isRecord(x.summary);
}

function extractPayloadFromHtmlSource(): string {
  const g = globalThis as {
    document?: { documentElement?: { outerHTML?: string } };
  };
  const html = g.document?.documentElement?.outerHTML ?? '';
  if (html === '') return '';
  const marker = 'id="i18nprune-inline-payload"';
  const idx = html.indexOf(marker);
  if (idx === -1) return '';
  const open = html.indexOf('>', idx);
  if (open === -1) return '';
  const closeTag = '<' + '/script>';
  const close = html.indexOf(closeTag, open + 1);
  if (close === -1) return '';
  return html.slice(open + 1, close).trim();
}

/** Reads `#i18nprune-inline-payload`, parses JSON, validates with Zod. DEV falls back to mock data when unset. */
export function loadPayloadResult(): PayloadLoadResult {
  const g = globalThis as {
    document?: { getElementById?: (id: string) => { textContent?: string | null } | null };
  };
  const el = g.document?.getElementById?.('i18nprune-inline-payload');
  const domPayload = el?.textContent?.trim() ?? '';
  const htmlPayload = extractPayloadFromHtmlSource();
  const raw = domPayload || htmlPayload;

  if (raw === '' || raw === REPORT_INLINE_PAYLOAD_PLACEHOLDER) {
    if (import.meta.env.DEV) return { ok: true, doc: MOCK_PROJECT_REPORT };
    return {
      ok: false,
      kind: 'missing',
      message: 'Embedded report payload is missing.',
      detail: 'The HTML was opened without running i18nprune report, or payload injection failed.',
    };
  }

  const strict = validatePayloadString(raw);
  if (strict.ok) return strict;

  if (import.meta.env.DEV) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (looksLikeReport(parsed)) return { ok: true, doc: parsed };
    } catch {
      /* use mock below */
    }
    return { ok: true, doc: MOCK_PROJECT_REPORT };
  }

  return strict;
}
