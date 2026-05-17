import type {
  ProjectReadinessChecks,
  ProjectReadinessCliPreset,
  ProjectReadinessRequest,
} from '../../types/project/index.js';

const PRESET_CHECKS: Record<ProjectReadinessCliPreset, ProjectReadinessChecks> = {
  validate: {
    configFilePresent: true,
    sourceLocaleJsonObject: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  quality: {
    configFilePresent: true,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  sync: {
    configFilePresent: true,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  missing: {
    configFilePresent: true,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  review: {
    configFilePresent: true,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  report: {
    configFilePresent: true,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  cleanup: {
    configFilePresent: true,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  generate: {
    configFilePresent: true,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  'locales-list': {
    configFilePresent: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
  },
  'locales-dynamic': {
    configFilePresent: true,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  'locales-delete': {
    configFilePresent: true,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  config: {
    configFilePresent: true,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  patch: {
    configFilePresent: true,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  init: {
    configFilePresent: true,
    sourceLocaleJsonObject: true,
    localesDirectoryAccessible: true,
    localesStructureRequired: true,
    srcRootDirectory: true,
  },
  doctor: {
    configFilePresent: true,
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
