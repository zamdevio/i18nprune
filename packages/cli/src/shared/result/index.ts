export {
  buildCliJsonEnvelope,
  stringifyCliCommandJson,
  stringifyEnvelope,
} from '@i18nprune/core';

export {
  issuesFromDiscoveryWarnings,
  issuesFromDoctorFindings,
  issuesFromDynamicScanCount,
  issuesFromLanguagesFilter,
  issuesFromLocaleTargetMissing,
  issuesFromLocalesUsage,
  issuesFromPatchingDiagnostics,
  issuesFromQualityEnglishIdentical,
  isLocaleTargetMissingMessage,
  mergeIssues,
  usageIssueFromI18nPruneError,
} from './cliEnvelopeIssues.js';

export { buildIoReadFailureEnvelope } from './ioEnvelope.js';

export {
  DOCS_SITE_ORIGIN,
  enrichIssuesWithDocHrefs,
  type IssueCodeDocLinkParts,
  issueCodeDocHref,
  normalizeRepoDocPath,
  resolveIssueCodeDocLink,
} from './issueDocLinks.js';

export { emitCliJsonOptionError } from './optionErrorEnvelope.js';
