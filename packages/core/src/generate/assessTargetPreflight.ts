import { collectTranslationSurfaceLeaves } from '../shared/locales/leaves/index.js';
import { targetLocaleCoversAllSourceLeaves } from '../shared/json/targetCoverage.js';
import { existsRuntimeFsSync } from '../runtime/helpers/sync/fs.js';
import type { LocaleSegmentWritePlan } from '../types/locales/segmentWritePlan.js';
import type { TranslationSurfaceLeaf } from '../types/locales/leaves/translationSurface.js';
import type { GenerateTargetPreflight } from '../types/generate/preflight.js';
import type { RuntimeFsPort } from '../types/runtime/fs.js';

/**
 * Compare target locale segments + merged JSON against schema source leaves before generate.
 */
export function assessGenerateTargetPreflight(input: {
  sourceLeaves: readonly Pick<TranslationSurfaceLeaf, 'path'>[];
  writePlan: LocaleSegmentWritePlan;
  existingRaw: unknown | null;
  fs: RuntimeFsPort;
}): GenerateTargetPreflight {
  const missingSegmentPaths = input.writePlan.segments
    .filter((segment) => !existsRuntimeFsSync(segment.absolutePath, input.fs))
    .map((segment) => segment.relativePath);

  const anySegmentOnDisk = input.writePlan.segments.some((segment) =>
    existsRuntimeFsSync(segment.absolutePath, input.fs),
  );

  const missingKeyPaths: string[] = [];
  if (anySegmentOnDisk && input.existingRaw !== null && input.existingRaw !== undefined) {
    const targetLeaves = collectTranslationSurfaceLeaves(input.existingRaw);
    const targetSet = new Set(targetLeaves.map((leaf) => leaf.path));
    for (const leaf of input.sourceLeaves) {
      if (!targetSet.has(leaf.path)) {
        missingKeyPaths.push(leaf.path);
      }
    }
  } else if (!anySegmentOnDisk) {
    return {
      status: 'proceed',
      missingSegmentPaths,
      missingKeyPaths: input.sourceLeaves.map((leaf) => leaf.path),
    };
  }

  if (missingSegmentPaths.length > 0 || missingKeyPaths.length > 0) {
    return { status: 'partial', missingSegmentPaths, missingKeyPaths };
  }

  if (
    input.existingRaw !== null &&
    input.existingRaw !== undefined &&
    targetLocaleCoversAllSourceLeaves(input.sourceLeaves, input.existingRaw)
  ) {
    return { status: 'fully_complete', missingSegmentPaths: [], missingKeyPaths: [] };
  }

  return { status: 'proceed', missingSegmentPaths, missingKeyPaths };
}
