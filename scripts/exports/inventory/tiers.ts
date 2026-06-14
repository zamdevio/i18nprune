export type StabilityTier = 'stable' | 'advanced' | 'internal' | 'unclassified';

/** Heuristic tier rules aligned with maintainer/systems/exports.md (pre–EX-3 bootstrap). */
export function classifySymbolTier(name: string): StabilityTier {
  if (name.startsWith('ISSUE_')) return 'stable';
  if (/^run[A-Z]/.test(name)) return 'stable';
  if (/^create[A-Z].*Context$/.test(name)) return 'stable';
  if (name === 'defineConfig' || name === 'loadConfig') return 'stable';

  if (
    name.startsWith('ENV_TRANSLATE_') ||
    name.startsWith('TRANSLATE_') ||
    name.startsWith('TRANSLATION_') ||
    name.startsWith('DEFAULT_PROVIDER_') ||
    name.startsWith('IDENTITY_STREAK_') ||
    name === 'IdentityAbortError' ||
    name.startsWith('Provider') ||
    name.startsWith('classifyProvider') ||
    name.startsWith('resolveProvider') ||
    name.startsWith('createProvider') ||
    name.startsWith('isRetryableProvider') ||
    name.startsWith('policyKeyFor') ||
    name.startsWith('buildTranslateParallel') ||
    name.startsWith('mapWithConcurrency') ||
    name.startsWith('resolveTranslateMaxParallel') ||
    name === 'TRANSLATE_WORKERS_CAP' ||
    name === 'TRANSLATE_POLICY_DEFAULTS'
  ) {
    return 'advanced';
  }

  if (
    name.startsWith('internal') ||
    name.endsWith('Internal') ||
    name === 'wrapCoreEnvelope' ||
    name === 'unwrapCoreEnvelope'
  ) {
    return 'internal';
  }

  return 'stable';
}
