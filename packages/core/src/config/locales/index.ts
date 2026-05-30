export {
  classifyLocalesSourceInput,
  issueLocalesSourceNotInBundle,
  validateLocalesSourceConfigValue,
} from './sourceValidate.js';
export type { LocalesSourceInputKind, LocalesSourceValidationResult } from './sourceValidate.js';
export { resolveSourceLocaleAbsoluteFromRelPaths, resolveSourceLocaleAbsolutePath } from './sourceResolve.js';
