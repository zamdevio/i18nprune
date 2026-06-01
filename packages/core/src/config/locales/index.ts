export {
  classifyLocalesSourceInput,
  issueLocalesSourceNotInBundle,
  validateLocalesSourceConfigValue,
} from './sourceValidate.js';
export type { LocalesSourceInputKind, LocalesSourceValidationResult } from '../../types/config/localesSource.js';
export { resolveSourceLocaleAbsoluteFromRelPaths, resolveSourceLocaleAbsolutePath } from './sourceResolve.js';
