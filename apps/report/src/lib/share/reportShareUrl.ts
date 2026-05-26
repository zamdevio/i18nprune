import { buildReportShareUrl } from '@i18nprune/core';

/** Canonical hosted report link for the current origin (dev or production). */
export function buildHostedReportShareUrl(reportId: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin.replace(/\/+$/, '') : undefined;
  return buildReportShareUrl(reportId, origin);
}
