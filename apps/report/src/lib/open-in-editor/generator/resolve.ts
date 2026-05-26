import type { ProjectReportEnvironment } from '../../../types/index.js';
import type { GeneratorEnvironment, GeneratorRuntimeFamily } from '../types.js';

const UNSUPPORTED_PLATFORMS = new Set([
  'browser',
  'cloudflare-worker',
  'cloudflare-workers',
]);

function normalizePlatform(platform: string): string {
  return platform.trim().toLowerCase();
}

/**
 * Resolve generator runtime from payload environment only.
 * Missing `environment` → unsupported (no inference fallback).
 */
export function resolveGeneratorEnvironment(
  environment: ProjectReportEnvironment | undefined,
): GeneratorEnvironment {
  if (!environment?.platform) {
    return { family: 'unsupported' };
  }

  const platform = normalizePlatform(environment.platform);
  if (platform === '' || UNSUPPORTED_PLATFORMS.has(platform)) {
    return { family: 'unsupported', source: environment };
  }

  if (environment.runtimeFamily === 'linux-wsl') {
    return { family: 'linux-wsl', source: environment };
  }

  const wslDistro = environment.wslDistroName?.trim();
  if (wslDistro) {
    return { family: 'linux-wsl', source: environment };
  }

  if (environment.runtimeFamily === 'windows' || platform === 'win32') {
    return { family: 'windows', source: environment };
  }

  if (environment.runtimeFamily === 'darwin' || platform === 'darwin') {
    return { family: 'darwin', source: environment };
  }

  if (environment.runtimeFamily === 'linux' || platform === 'linux') {
    return { family: 'linux', source: environment };
  }

  return { family: 'unsupported', source: environment };
}

/** Display label for generator family (overview, policy messages). */
export function generatorFamilyLabel(family: GeneratorRuntimeFamily): string {
  switch (family) {
    case 'windows':
      return 'Windows';
    case 'darwin':
      return 'macOS';
    case 'linux':
      return 'Linux';
    case 'linux-wsl':
      return 'WSL';
    case 'unsupported':
      return 'unsupported';
  }
}
