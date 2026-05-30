import type {
  ProjectReadinessChecks,
  ProjectReadinessCliPreset,
  ProjectReadinessRequest,
} from '../../types/project/index.js';

/** Catalog + bundle checks for `locales.source` (language code only). */
const LOCALES_SOURCE_LANG: Pick<ProjectReadinessChecks, 'localesSourceLanguageCode'> = {
  localesSourceLanguageCode: true,
};

const PRESET_CHECKS: Record<ProjectReadinessCliPreset, ProjectReadinessChecks> = {
  validate: {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  quality: {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  sync: {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  missing: {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  review: {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  report: {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  cleanup: {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  generate: {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  'locales-list': {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
  },
  'locales-dynamic': {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  'locales-delete': {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  config: {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  patch: {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  init: {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  doctor: {
    configFilePresent: true,
    ...LOCALES_SOURCE_LANG,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
};

export function resolveProjectReadinessChecks(request: ProjectReadinessRequest): ProjectReadinessChecks {
  if (request.mode === 'custom') {
    return { ...request.checks };
  }
  const resolved = PRESET_CHECKS[request.preset];
  return { ...resolved };
}

export function presetUsesValidateSourceIssueCode(preset: ProjectReadinessCliPreset): boolean {
  return preset === 'validate';
}
