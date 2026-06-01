import type { LocaleReadDiagnostic } from './read.js';

export type WriteFlatLocaleJsonDocumentResult =
  | { ok: true; diagnostics: LocaleReadDiagnostic[] }
  | { ok: false; diagnostics: LocaleReadDiagnostic[] };
