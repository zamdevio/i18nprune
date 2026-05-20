import { DEMO_WEB_APP_BASE } from '../shared/constants/links.js';
import type { ShareLinks } from '../types/share/index.js';

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** Public URLs for a hosted **project** snapshot (web viewer + worker metadata). */
export function buildProjectShareLinks(input: { workerBaseUrl: string; projectId: string }): ShareLinks {
  const base = trimTrailingSlash(input.workerBaseUrl);
  return {
    web: `${DEMO_WEB_APP_BASE}/p/${encodeURIComponent(input.projectId)}`,
    worker: `${base}/v1/projects/${encodeURIComponent(input.projectId)}`,
  };
}
