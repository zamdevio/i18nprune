import { DEMO_REPORT_URL, DEMO_WEB_APP_BASE } from '../../shared/constants/links.js';
import type { ShareLinks } from '../../types/share/index.js';

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** Public web workspace URL */
export function buildWebWorkspaceShareUrl(
  projectId: string,
  webAppBase: string = DEMO_WEB_APP_BASE,
): string {
  const base = trimTrailingSlash(webAppBase);
  return `${base}/#/workspace?id=${encodeURIComponent(projectId)}`;
}

/** Public URLs for a hosted **project** snapshot (web workspace + worker metadata). */
export function buildProjectShareLinks(input: { workerBaseUrl: string; projectId: string }): ShareLinks {
  const base = trimTrailingSlash(input.workerBaseUrl);
  return {
    web: buildWebWorkspaceShareUrl(input.projectId),
    worker: `${base}/v1/projects/${encodeURIComponent(input.projectId)}`,
  };
}

/** Public URLs for a hosted **report** payload (report UI + worker metadata). */
export function buildReportShareLinks(input: { workerBaseUrl: string; reportId: string }): ShareLinks {
  const base = trimTrailingSlash(input.workerBaseUrl);
  return {
    report: `${DEMO_REPORT_URL}/s/${encodeURIComponent(input.reportId)}`,
    worker: `${base}/v1/reports/${encodeURIComponent(input.reportId)}`,
  };
}
