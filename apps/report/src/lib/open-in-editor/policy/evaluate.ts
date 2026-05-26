import { resolveGeneratorEnvironment } from '../generator/resolve.js';
import type {
  EditorLinkPolicy,
  GeneratorEnvironment,
  GeneratorRuntimeFamily,
  LinkPolicyReason,
  ViewerEnvironment,
  ViewerRuntimeFamily,
} from '../types.js';
import { isSyntheticCwd } from './syntheticCwd.js';

export type PolicyInput = {
  generator: GeneratorEnvironment;
  viewer: ViewerEnvironment;
  cwd: string;
};

function deny(reason: LinkPolicyReason): EditorLinkPolicy {
  return { allow: false, reason };
}

function allowNative(): EditorLinkPolicy {
  return { allow: true, bridge: 'native' };
}

function isNativePair(
  generator: GeneratorRuntimeFamily,
  viewer: ViewerRuntimeFamily,
): boolean {
  if (viewer === 'unknown') return false;
  return generator === viewer;
}

/**
 * Centralized, editor-agnostic compatibility policy.
 * Conservative: false negatives preferred over false positives.
 */
export function evaluateEditorLinkPolicy(input: PolicyInput): EditorLinkPolicy {
  const { generator, viewer, cwd } = input;
  const family = generator.family;

  if (family === 'unsupported') {
    return deny('generator-environment-unsupported');
  }

  if (isSyntheticCwd(cwd)) {
    return deny('synthetic-cwd');
  }

  if (family === 'linux-wsl') {
    const distro = generator.source?.wslDistroName?.trim();
    if (!distro) {
      return deny('missing-runtime-metadata');
    }
    return deny('wsl-cross-host-unsupported');
  }

  if (viewer.family === 'unknown') {
    return deny('viewer-environment-incompatible');
  }

  if (viewer.isCoarsePointer || viewer.isNarrowViewport) {
    return deny('mobile-browser');
  }

  if (isNativePair(family, viewer.family)) {
    return allowNative();
  }

  return deny('viewer-environment-incompatible');
}

/** Policy when `project.environment` is absent — no inference. */
export function policyForMissingEnvironment(cwd: string): EditorLinkPolicy {
  if (isSyntheticCwd(cwd)) {
    return deny('synthetic-cwd');
  }
  return deny('missing-runtime-metadata');
}

export function evaluateEditorLinkPolicyFromPayload(input: {
  environment: import('../../../types/index.js').ProjectReportEnvironment | undefined;
  cwd: string;
  viewer: ViewerEnvironment;
}): EditorLinkPolicy {
  if (!input.environment) {
    return policyForMissingEnvironment(input.cwd);
  }
  const generator = resolveGeneratorEnvironment(input.environment);
  return evaluateEditorLinkPolicy({
    generator,
    viewer: input.viewer,
    cwd: input.cwd,
  });
}
