import {
  DEFAULT_WORKER_API_URL,
  DEMO_REPORT_URL,
  DEMO_WEB_APP_BASE,
  GITHUB_REPO_URL,
  NPM_PACKAGE_URL,
  getDocsUrl,
} from '@i18nprune/core';

/** Marketing site (landing). */
export const LANDING_SITE_URL = 'https://i18nprune.dev' as const;

/** VS Code Marketplace (publisher `zamdevio`, extension `i18nprune` — see `apps/extension/package.json`). */
export const VSCODE_MARKETPLACE_EXTENSION_URL =
  'https://marketplace.visualstudio.com/items?itemName=zamdevio.i18nprune' as const;

import type { EcosystemLink } from '../types/index.js';

export const ECOSYSTEM_LINKS = {
  landing: { id: 'landing', label: 'i18nprune.dev', href: LANDING_SITE_URL, description: 'Product overview', external: true },
  docs: { id: 'docs', label: 'Docs', href: getDocsUrl(), description: 'CLI, SDK, issues', external: true },
  docsShare: {
    id: 'docs-share',
    label: 'Share command',
    href: getDocsUrl('commands/share/README'),
    description: 'Hosted links & cache',
    external: true,
  },
  worker: {
    id: 'worker',
    label: 'Worker API',
    href: `${DEFAULT_WORKER_API_URL.replace(/\/$/, '')}/docs`,
    description: 'Edge validators',
    external: true,
  },
  report: { id: 'report', label: 'Report app', href: DEMO_REPORT_URL, description: 'Paste & view reports', external: true },
  web: { id: 'web', label: 'Web app', href: DEMO_WEB_APP_BASE, description: 'You are here', external: true },
  github: { id: 'github', label: 'GitHub', href: GITHUB_REPO_URL, description: 'Source & issues', external: true },
  npm: { id: 'npm', label: 'npm CLI', href: NPM_PACKAGE_URL, description: 'i18nprune package', external: true },
} as const satisfies Record<string, EcosystemLink>;

export const ECOSYSTEM_SURFACES: readonly EcosystemLink[] = [
  { id: 'cli', label: 'CLI', href: NPM_PACKAGE_URL, description: 'npm package · local dev loop', external: true },
  {
    id: 'extension',
    label: 'IDE extension',
    href: VSCODE_MARKETPLACE_EXTENSION_URL,
    description: 'VS Code · drift in the editor',
    external: true,
  },
  ECOSYSTEM_LINKS.web,
  ECOSYSTEM_LINKS.worker,
  ECOSYSTEM_LINKS.report,
];

export const ECOSYSTEM_NAV_LINKS: readonly EcosystemLink[] = [
  ECOSYSTEM_LINKS.landing,
  ECOSYSTEM_LINKS.docs,
  ECOSYSTEM_LINKS.worker,
  ECOSYSTEM_LINKS.report,
  ECOSYSTEM_LINKS.github,
];
