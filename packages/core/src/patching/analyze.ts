import type { PatchingAnalyzeOutput, PatchingDiagnostic, PatchingRunInput } from '../types/patching/index.js';
import { GENERATED_RECIPE_ID } from './constants.js';
import { resolvePatchingConfig } from './config.js';
import { buildPatchingSectionIncompleteDiagnostic } from './sectionCompleteness.js';
import {
  readFileSafe,
  listLocaleFilesFromDir,
  resolveLocalesDir,
  resolvePatchingFilePath,
} from './io.js';
import { catalogDiagnostics, configSizeDiagnostics, parseLocaleRecords } from './locales.js';
import { detectPatchingRecipe } from './recipe.js';
import { codeSet, toMessage } from './utils.js';

export async function analyzePatchingState(input: PatchingRunInput): Promise<PatchingAnalyzeOutput> {
  const initial = resolvePatchingConfig(input.config);
  const diagnostics: PatchingDiagnostic[] = [];
  const sectionIncomplete = buildPatchingSectionIncompleteDiagnostic(input.config, {
    effectiveWantsRun: initial.enabled || Boolean(input.treatAsPatchRequested),
  });
  if (sectionIncomplete) diagnostics.push(sectionIncomplete);

  if (!initial.enabled) {
    diagnostics.push({
      severity: 'info',
      code: 'i18nprune.patching.disabled',
      message: 'patching: disabled by config',
      docPath: 'patching/README',
    });
    return {
      config: initial,
      localeRecords: [],
      configOnlyCodes: [],
      fileOnlyCodes: [],
      diagnostics,
      hasError: false,
      canAutoPatch: false,
    };
  }

  const detected = await detectPatchingRecipe(input);
  if (!detected.ok) {
    return {
      config: detected.config,
      localeRecords: [],
      configOnlyCodes: [],
      fileOnlyCodes: [],
      diagnostics: detected.diagnostics,
      hasError: detected.diagnostics.some((d) => d.severity === 'error'),
      canAutoPatch: false,
    };
  }

  const resolved = detected.config;
  const root = input.projectRoot;

  const configAbs = resolvePatchingFilePath(input.runtime, root, resolved.configPath);
  const configRead = await readFileSafe(input.runtime, configAbs);
  if (!configRead.ok) {
    return {
      config: resolved,
      localeRecords: [],
      configOnlyCodes: [],
      fileOnlyCodes: [],
      diagnostics: configRead.diagnostics,
      hasError: configRead.diagnostics.some((d) => d.severity === 'error'),
      canAutoPatch: false,
    };
  }

  if (resolved.recipe !== GENERATED_RECIPE_ID) {
    const loaderAbs = resolvePatchingFilePath(input.runtime, root, resolved.loaderPath);
    const loaderRead = await readFileSafe(input.runtime, loaderAbs);
    if (!loaderRead.ok) {
      return {
        config: resolved,
        localeRecords: [],
        configOnlyCodes: [],
        fileOnlyCodes: [],
        diagnostics: loaderRead.diagnostics,
        hasError: loaderRead.diagnostics.some((d) => d.severity === 'error'),
        canAutoPatch: false,
      };
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(configRead.content);
  } catch (err) {
    return {
      config: resolved,
      localeRecords: [],
      configOnlyCodes: [],
      fileOnlyCodes: [],
      diagnostics: [
        {
          severity: 'error',
          code: 'i18nprune.patching.config_parse_failed',
          message: `patching: failed to parse config JSON (${configAbs}): ${toMessage(err)}`,
          docPath: 'patching/loader.md',
        },
      ],
      hasError: true,
      canAutoPatch: false,
    };
  }
  const records = parseLocaleRecords(parsed);
  if (!records) {
    return {
      config: resolved,
      localeRecords: [],
      configOnlyCodes: [],
      fileOnlyCodes: [],
      diagnostics: [
        {
          severity: 'error',
          code: 'i18nprune.patching.config_invalid_schema',
          message: 'patching: invalid locales schema; expected locales records with code/englishName/nativeName/direction',
          docPath: 'patching/loader.md',
        },
      ],
      hasError: true,
      canAutoPatch: false,
    };
  }

  diagnostics.push(...configSizeDiagnostics(configRead.content, records.length, resolved.sizeLimitBytes));
  diagnostics.push(...catalogDiagnostics(records));
  const localesDir = resolveLocalesDir(input.runtime, resolved, root);
  const fileCodes = codeSet(listLocaleFilesFromDir(input.runtime, localesDir));
  const localesDirDisplay = input.runtime.path.relative(input.runtime.path.dirname(configAbs), localesDir) || '.';
  const configCodes = codeSet(records.map((r) => r.code));
  const configOnlyCodes = configCodes.filter((code) => !fileCodes.includes(code));
  const fileOnlyCodes = fileCodes.filter((code) => !configCodes.includes(code));
  for (const code of configOnlyCodes) {
    diagnostics.push({
      severity: 'warn',
      code: 'i18nprune.patching.config_locale_missing_file',
      message: `patching: config contains locale "${code}" but ${localesDirDisplay}/${code}.json is missing`,
      docPath: 'patching/loader.md',
    });
  }
  for (const code of fileOnlyCodes) {
    diagnostics.push({
      severity: 'warn',
      code: 'i18nprune.patching.file_locale_missing_config',
      message: `patching: ${localesDirDisplay}/${code}.json exists but config has no "${code}" locale record`,
      docPath: 'patching/loader.md',
    });
  }

  const hasError = diagnostics.some((d) => d.severity === 'error');
  return {
    config: resolved,
    localeRecords: records,
    configOnlyCodes,
    fileOnlyCodes,
    diagnostics,
    hasError,
    canAutoPatch: !hasError,
  };
}
