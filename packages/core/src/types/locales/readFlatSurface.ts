import type { LocaleReadDiagnostic } from './read.js';
import type { TranslationSurfaceLeaf } from './leaves/translationSurface.js';

export type ReadFlatLocaleJsonSurfaceResult =
  | { ok: true; document: unknown; leaves: TranslationSurfaceLeaf[]; text: string; diagnostics: LocaleReadDiagnostic[] }
  | { ok: false; leaves: []; diagnostics: LocaleReadDiagnostic[] };

export type ReadLocaleBundleResult = ReadFlatLocaleJsonSurfaceResult;
