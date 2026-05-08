import type {
  PatchingAction,
  PatchingDiagnostic,
  PatchingFileEdit,
  PatchingLocaleRecord,
  PatchingPlan,
  PatchingResult,
} from '../types/patching/index.js';
import { GENERATED_RECIPE_ID } from './constants.js';
import {
  composeLoadersGeneratedFile,
  extractExistingDefaultLocaleCode,
  extractUserIsland,
  renderGeneratedInnerBlock,
} from './generatedModule.js';
import { applyLocaleAction, parseLocaleRecords } from './locales.js';
import { codeSet, toMessage } from './utils.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';

export function buildPlanFromGeneratedFiles(input: {
  action: PatchingAction;
  changedLocaleCodes: readonly string[];
  configPath: string;
  configText: string;
  generatedPath: string;
  generatedText: string;
  importBase: string;
  sourceLocaleCode?: string;
}): { ok: true; plan: PatchingPlan; diagnostics: PatchingDiagnostic[] } | {
  ok: false;
  diagnostics: PatchingDiagnostic[];
  skipReason: PatchingResult['skipReason'];
} {
  const diagnostics: PatchingDiagnostic[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.configText);
  } catch (err) {
    return {
      ok: false,
      skipReason: 'parse_error',
      diagnostics: [
        {
          severity: 'warn',
          code: 'i18nprune.patching.config_parse_failed',
          message: `patching: failed to parse config JSON (${input.configPath}): ${toMessage(err)}`,
          docPath: 'patching/README',
        },
      ],
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      skipReason: 'unsupported_pattern',
      diagnostics: [
        {
          severity: 'warn',
          code: 'i18nprune.patching.config_shape_unsupported',
          message: `patching: expected object JSON in ${input.configPath}`,
          docPath: 'patching/README',
        },
      ],
    };
  }

  const localeRecords = parseLocaleRecords(parsed);
  if (!localeRecords) {
    return {
      ok: false,
      skipReason: 'unsupported_pattern',
      diagnostics: [
        {
          severity: 'warn',
          code: 'i18nprune.patching.locales_array_missing',
          message: `patching: expected locales record array with {code,englishName,nativeName,direction} in ${input.configPath}`,
          docPath: 'patching/README',
        },
      ],
    };
  }

  let nextLocales = applyLocaleAction(localeRecords, input.action, input.changedLocaleCodes);
  const normalizedSourceCode = input.sourceLocaleCode ? normalizeLanguageCode(input.sourceLocaleCode) : undefined;
  if (normalizedSourceCode && !nextLocales.some((r) => r.code === normalizedSourceCode)) {
    const sourceFromPrevious = localeRecords.find((r) => r.code === normalizedSourceCode);
    const restored: PatchingLocaleRecord = sourceFromPrevious ?? {
      code: normalizedSourceCode,
      englishName: normalizedSourceCode,
      nativeName: normalizedSourceCode,
      direction: 'ltr',
    };
    nextLocales = [restored, ...nextLocales];
    diagnostics.push({
      severity: 'warn',
      code: 'i18nprune.patching.source_locale_restored',
      message: `patching: restored missing source locale "${normalizedSourceCode}" in config locales`,
      docPath: 'patching/config.md',
    });
  }
  const nextConfigObj = { ...(parsed as Record<string, unknown>), locales: nextLocales };
  const nextConfigText = `${JSON.stringify(nextConfigObj, null, 2)}\n`;

  const userIsland = extractUserIsland(input.generatedText);
  const previousDefault = extractExistingDefaultLocaleCode(input.generatedText);
  const localeCodes = new Set(nextLocales.map((r) => r.code));
  const selectedDefault =
    previousDefault && localeCodes.has(previousDefault)
      ? previousDefault
      : normalizedSourceCode && localeCodes.has(normalizedSourceCode)
        ? normalizedSourceCode
        : nextLocales[0]?.code;
  const inner = renderGeneratedInnerBlock({
    records: nextLocales,
    importBase: input.importBase,
    defaultLocaleCode: selectedDefault,
  });
  const nextGeneratedText = composeLoadersGeneratedFile(inner, userIsland);

  const edits: PatchingFileEdit[] = [];
  if (nextConfigText !== input.configText) {
    edits.push({
      path: input.configPath,
      before: input.configText,
      after: nextConfigText,
      kind: 'config',
    });
  }
  if (nextGeneratedText !== input.generatedText) {
    edits.push({
      path: input.generatedPath,
      before: input.generatedText,
      after: nextGeneratedText,
      kind: 'generated',
    });
  }

  diagnostics.push({
    severity: 'info',
    code: 'i18nprune.patching.plan_built',
    message: `patching: planned ${String(edits.length)} file edit(s) (generated loader module)`,
    docPath: 'patching/README',
  });

  return {
    ok: true,
    diagnostics,
    plan: {
      recipe: GENERATED_RECIPE_ID,
      action: input.action,
      changedLocaleCodes: codeSet(input.changedLocaleCodes),
      edits,
    },
  };
}
