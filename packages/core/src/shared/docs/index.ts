/**
 * Docs URL helpers for CLI, landing, and report. Prefer `import { … } from '@i18nprune/core'` or
 * `import { docs } from 'i18nprune/core'` (namespace).
 */
export { docsCommandUrl, getDocsUrl } from './urls.js';
export {
  type IssueCodeDocLinkParts,
  issueCodeDocHref,
  issueCodeRepoDocPathForIssueCode,
  resolveIssueCodeDocLink,
} from './issueAnchors.js';
export { normalizeRepoDocPath } from './repoPaths.js';
