import type { Context } from '@/types/core/context/index.js';
import { toExtractorScanInput } from '@/shared/extractor/scanInput.js';
import {
  compareDottedPathDepth,
  computeMissingLiteralKeysFromResolvedKeys,
  extractor,
} from '@i18nprune/core';

export { compareDottedPathDepth, computeMissingLiteralKeysFromResolvedKeys };

/**
 * All resolved literal / template-resolved keys found under `srcRoot`, using **per-file** const maps.
 * Prefer this over merging all sources and a single `buildConstStringMap` — duplicate identifiers
 * (e.g. `const NS` in different files) would otherwise collide and produce wrong resolved paths.
 */
export function resolvedLiteralKeysInProject(ctx: Context): ReadonlySet<string> {
  return extractor.keySites.scanProjectLiteralKeyUsage(toExtractorScanInput(ctx)).resolvedKeys;
}

/**
 * Literal keys used in scanned source that are not present as string leaves in `localeJson`.
 * Uses {@link resolvedLiteralKeysInProject} so template + const resolution matches keySites.
 */
export function computeMissingLiteralKeys(ctx: Context, localeJson: unknown): string[] {
  return computeMissingLiteralKeysFromResolvedKeys(localeJson, resolvedLiteralKeysInProject(ctx));
}
