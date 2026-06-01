import { assertSupportedTargetLanguageCode } from '../shared/languages/validateTargetCode.js';
import type { AssertGenerateTargetCodesInput } from '../types/locales/index.js';
import { assertNotSourceTargetLocale } from './source.js';

/** Validates generate targets: not source locale, and present in translation catalog. */
export function assertGenerateTargetCodes(input: AssertGenerateTargetCodesInput): void {
  const { commandName, codes, sourceLocalePath, path } = input;
  const ctx = {
    paths: { sourceLocale: sourceLocalePath },
    path,
  };
  for (const target of codes) {
    assertNotSourceTargetLocale(commandName, target, sourceLocalePath, ctx);
    assertSupportedTargetLanguageCode(target);
  }
}
