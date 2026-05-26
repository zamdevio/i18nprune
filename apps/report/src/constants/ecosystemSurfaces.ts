import {
  DEFAULT_WORKER_API_URL,
  DEMO_REPORT_URL,
  DEMO_WEB_APP_BASE,
  GITHUB_REPO_URL,
  NPM_PACKAGE_URL,
  getDocsUrl,
} from '@i18nprune/core';
import type { EcosystemNavLink } from '@i18nprune/ui/types/nav';
import type { SurfaceLink } from '@i18nprune/ui/types/surfaces';

export const REPORT_ECOSYSTEM_SURFACES: readonly SurfaceLink[] = [
  { id: 'cli', label: 'CLI', href: NPM_PACKAGE_URL, description: 'npm package · local dev loop', external: true },
  {
    id: 'extension',
    label: 'IDE extension',
    href: 'https://marketplace.visualstudio.com/items?itemName=zamdevio.i18nprune',
    description: 'VS Code · drift in the editor',
    external: true,
  },
  { id: 'web', label: 'Web app', href: DEMO_WEB_APP_BASE, description: 'Project zip workspace', external: true },
  {
    id: 'worker',
    label: 'Worker API',
    href: `${DEFAULT_WORKER_API_URL.replace(/\/$/, '')}/docs`,
    description: 'Edge validators',
    external: true,
  },
  { id: 'report', label: 'Report app', href: DEMO_REPORT_URL, description: 'Paste & view reports', external: true },
];

export const REPORT_ECOSYSTEM_NAV_LINKS: readonly EcosystemNavLink[] = [
  { id: 'landing', label: 'i18nprune.dev', href: 'https://i18nprune.dev', description: 'Product overview' },
  { id: 'docs', label: 'Docs', href: getDocsUrl(), description: 'CLI, SDK, issues' },
  {
    id: 'worker',
    label: 'Worker API',
    href: `${DEFAULT_WORKER_API_URL.replace(/\/$/, '')}/docs`,
    description: 'Edge validators',
  },
  { id: 'web', label: 'Web app', href: DEMO_WEB_APP_BASE, description: 'Project workspace' },
  { id: 'github', label: 'GitHub', href: GITHUB_REPO_URL, description: 'Source & issues' },
];

export const REPORT_SHARE_DOCS_LINK = getDocsUrl('commands/share/README');
