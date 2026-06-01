import type { LocaleLeafMode, LocaleMetadataReport } from '../../../../types/locales/leaves/index.js';
import { applyLocaleLeafMode } from './applyLocaleLeafMode.js';
import type { ResolveLocaleLeafModeInput } from '../../../../types/locales/leaves/localeLeafInputs.js';

export function metadataModeEnabledFromConfig(mode: LocaleLeafMode | undefined): boolean {
  return mode === 'structured';
}

/** Resolve final leaf mode with stable precedence: strip > metadata > config > legacy default. */
export function resolveLocaleLeafMode(input: ResolveLocaleLeafModeInput): {
  mode: LocaleLeafMode;
  conflict: boolean;
  reason: 'strip_precedence' | 'explicit_metadata' | 'config_structured' | 'default_legacy';
} {
  if (input.stripMetadataFlag === true) {
    return {
      mode: 'legacy_string',
      conflict: input.metadataFlag === true,
      reason: 'strip_precedence',
    };
  }
  if (input.metadataFlag === true) return { mode: 'structured', conflict: false, reason: 'explicit_metadata' };
  if (metadataModeEnabledFromConfig(input.configMode)) {
    return { mode: 'structured', conflict: false, reason: 'config_structured' };
  }
  return { mode: 'legacy_string', conflict: false, reason: 'default_legacy' };
}

/**
 * Resolve locale leaf mode ({@link resolveLocaleLeafMode}) then {@link applyLocaleLeafMode}.
 * Shared by **generate** (including **`generate --resume`**) immediately after translation passes.
 */
export function applyLocaleLeafNormalization(input: {
  localeJson: unknown;
  sourceMap: Map<string, string>;
  resolveInput: ResolveLocaleLeafModeInput;
}): {
  next: unknown;
  report: LocaleMetadataReport;
  modeDecision: ReturnType<typeof resolveLocaleLeafMode>;
} {
  const modeDecision = resolveLocaleLeafMode(input.resolveInput);
  const normalized = applyLocaleLeafMode({
    localeJson: input.localeJson,
    sourceMap: input.sourceMap,
    mode: modeDecision.mode,
  });
  return {
    next: normalized.next,
    report: normalized.report,
    modeDecision,
  };
}
