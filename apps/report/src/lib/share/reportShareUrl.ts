import { buildReportShareUrl, DEMO_REPORT_URL } from '@i18nprune/core';
import { parseReportShareId } from './parseReportShareId.js';

/** Report SPA base URL for share links (`/#/?id=`). Prefers current page origin (local or custom domain). */
export function resolveReportShareAppBase(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin?.trim();
    if (origin && origin !== 'null') {
      return origin.replace(/\/+$/, '');
    }
  }
  return DEMO_REPORT_URL.replace(/\/+$/, '');
}

/** Hosted report link on the current report app origin — `https://…/#/?id=…`. */
export function buildHostedReportShareUrl(reportId: string): string {
  return buildReportShareUrl(reportId.trim(), resolveReportShareAppBase());
}

/**
 * Copy-ready share URL: always `origin/#/?id=` when a report id is known.
 * Rebuilds from id so stored worker/demo links upgrade to the current origin.
 */
export function resolveCopyShareLink(input: {
  reportId?: string | null;
  link?: string | null;
}): string | null {
  const id = input.reportId?.trim() || (input.link ? parseReportShareId(input.link) : null);
  if (id) return buildHostedReportShareUrl(id);
  const fallback = input.link?.trim();
  return fallback && fallback.length > 0 ? fallback : null;
}
