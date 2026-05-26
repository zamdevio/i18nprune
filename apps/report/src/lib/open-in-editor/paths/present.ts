import type { GeneratorRuntimeFamily, PathBridge, PresentedPath, ResolvedFileTarget } from '../types.js';

export type PresentPathInput = {
  target: ResolvedFileTarget;
  generatorFamily: GeneratorRuntimeFamily;
  bridge: PathBridge;
};

/**
 * Format an absolute path for editor URI adapters (bridge selected by policy only).
 * v1: native bridge — POSIX for linux/darwin/wsl; forward-slash Windows for windows.
 */
export function presentPathForOpen(input: PresentPathInput): PresentedPath {
  const { target, generatorFamily, bridge } = input;
  if (bridge !== 'native') {
    throw new Error(`Unsupported path bridge: ${bridge}`);
  }

  const normalized = target.absolutePath.replace(/\\/g, '/');

  if (generatorFamily === 'windows') {
    return normalized;
  }

  if (normalized.startsWith('/')) {
    return normalized;
  }

  return `/${normalized}`;
}
