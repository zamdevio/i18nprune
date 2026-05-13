/**
 * Validate engine: compare resolved literal keys to string leaves in source locale JSON.
 * Subpath: `@i18nprune/core/validate`. CLI wraps {@link runValidate} in a `CliJsonEnvelope` for `--json`.
 */
export { compareDottedPathDepth, computeMissingLiteralKeysFromResolvedKeys } from './missingLiterals.js';
export { buildValidateScanPayload } from './buildPayload.js';
export { buildValidateIssues } from './issues.js';
export { buildValidateHumanView } from './human.js';
export { buildValidateReportView } from './report.js';
export { runValidate } from './run.js';
export type { ValidateScanPayload } from './buildPayload.js';
export type { BuildValidateHumanViewInput, ValidateHumanView } from './human.js';
export type { BuildValidateReportViewInput, ValidateReportView } from './report.js';
export type {
  ValidateHostHooks,
  ValidateJsonPayload,
  ValidateRunOptions,
  ValidateRunResult,
} from '../types/validate/index.js';
