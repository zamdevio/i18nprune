import { setAtPath } from '../../json/path.js';
import { collectTranslationSurfaceLeaves } from '../leaves/index.js';
import { readSourceLocaleLeaves } from './localeSurface.js';
import { readLocaleJsonOrEmpty } from './readJson.js';
import {
  pairedSourceSegmentRelativePath,
  resolvePairedSourceSegmentAbsolutePath,
} from './segmentPairing.js';
import type { CoreContext } from '../../../types/context/index.js';
import type { TranslationSurfaceLeaf } from '../../../types/locales/leaves/translationSurface.js';

/** Build a nested canonical template object from source leaves (never literal dotted keys). */
export function buildSegmentTemplateFromSource(
  _sourceRaw: unknown,
  leaves: readonly TranslationSurfaceLeaf[],
): unknown {
  let template: unknown = {};
  for (const leaf of leaves) {
    template = setAtPath(template, leaf.path, leaf.value);
  }
  return template;
}

export type SyncSegmentSourcePlan = {
  sourceRelativePath: string;
  sourceAbsolutePath: string;
  sourceRaw: unknown;
  effectiveSourceLeaves: TranslationSurfaceLeaf[];
  template: unknown;
  sourceMap: Map<string, string>;
};

/** Per-segment source template for sync (paired source segment, schema-filtered). */
export function resolveSyncSegmentSourcePlan(
  ctx: CoreContext,
  input: {
    targetSegmentRelativePath: string;
    targetLocaleCode: string;
    schemaPaths: ReadonlySet<string>;
  },
): SyncSegmentSourcePlan {
  const sourceRelativePath =
    pairedSourceSegmentRelativePath(ctx, input.targetSegmentRelativePath, input.targetLocaleCode) ??
    input.targetSegmentRelativePath;
  const sourceAbsolutePath = resolvePairedSourceSegmentAbsolutePath(
    ctx,
    input.targetSegmentRelativePath,
    input.targetLocaleCode,
  );
  const sourceRaw = readLocaleJsonOrEmpty(ctx, sourceAbsolutePath);
  const allSourceLeaves = collectTranslationSurfaceLeaves(sourceRaw);
  const effectiveSchemaPaths =
    input.schemaPaths.size > 0 ? input.schemaPaths : new Set(allSourceLeaves.map((l) => l.path));
  const effectiveSourceLeaves = allSourceLeaves.filter((l) => effectiveSchemaPaths.has(l.path));

  const template = buildSegmentTemplateFromSource(sourceRaw, effectiveSourceLeaves);

  return {
    sourceRelativePath,
    sourceAbsolutePath,
    sourceRaw,
    effectiveSourceLeaves,
    template,
    sourceMap: new Map(effectiveSourceLeaves.map((l) => [l.path, l.value])),
  };
}

/** Schema path set for sync; falls back to merged source leaves when scan is empty. */
export function resolveGlobalSyncSchemaPaths(
  ctx: CoreContext,
  schemaPaths: ReadonlySet<string>,
): ReadonlySet<string> {
  if (schemaPaths.size > 0) return schemaPaths;
  return new Set(readSourceLocaleLeaves(ctx).map((l) => l.path));
}
