import type { RuntimePathPort } from '../types/runtime/path.js';
import { assertSupportedTargetLanguageCode } from '../shared/languages/validateTargetCode.js';
import { assertNotSourceTargetLocale } from './source.js';

export type AssertGenerateTargetCodesInput = {
  commandName: string;
  codes: readonly string[];
  sourceLocalePath: string;
  path: RuntimePathPort;
};

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
