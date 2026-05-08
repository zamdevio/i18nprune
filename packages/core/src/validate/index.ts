/**
 * Validate engine (pure): compare resolved literal keys to string leaves in source locale JSON.
 * Subpath: `@i18nprune/core/validate`. Project scan + envelopes stay in the CLI (`runValidate`, optional `RuntimeAdapters` for source JSON I/O).
 */
export { compareDottedPathDepth, computeMissingLiteralKeysFromResolvedKeys } from './missingLiterals.js';
export { buildValidateScanPayload } from './buildPayload.js';
export { buildValidateIssues } from './issues.js';
export { buildValidateHumanView } from './human.js';
export { buildValidateReportView } from './report.js';
export type { ValidateScanPayload } from './buildPayload.js';
export type { BuildValidateHumanViewInput, ValidateHumanView } from './human.js';
export type { BuildValidateReportViewInput, ValidateReportView } from './report.js';
