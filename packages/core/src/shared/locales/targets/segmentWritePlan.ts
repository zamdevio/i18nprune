import type { CoreContext } from '../../../types/context/index.js';
import type {
  LocaleSegmentWritePlan,
  LocaleSegmentWriteTarget,
} from '../../../types/locales/index.js';
import type { LocalesLayoutStructure } from '../../../types/locales/layout.js';
import { I18nPruneError } from '../../errors/index.js';
import { localeSegmentRefFromAbsolute, resolveLocaleSegmentAbsolutePath } from '../enumerate/index.js';
import { resolveLocalesLayoutFromContext } from '../layout/resolveLayout.js';
import { normalizeLanguageCode } from '../../languages/normalize.js';
import { existsRuntimeFsSync } from '../../../runtime/helpers/sync/fs.js';
import { primarySegmentForLocale, segmentsForLocaleCode, sourceLocaleCodeFromContext } from './context.js';

/**
 * Replace the locale code inside a bundle-relative segment path for the active layout structure.
 *
 * @returns `null` when the path cannot be rewritten for this structure.
 */
export function swapLocaleInSegmentRelativePath(input: {
  structure: LocalesLayoutStructure;
  relativePath: string;
  targetLocale: string;
}): string | null {
  const target = normalizeLanguageCode(input.targetLocale);
  const rel = input.relativePath.replace(/\\/g, '/');

  if (input.structure === 'locale_file') {
    if (rel.includes('/')) return null;
    return `${target}.json`;
  }

  if (input.structure === 'locale_per_dir') {
    const slash = rel.indexOf('/');
    if (slash < 0) return null;
    const rest = rel.slice(slash + 1);
    if (!rest) return null;
    return `${target}/${rest}`;
  }

  if (input.structure === 'feature_bundle') {
    const slash = rel.lastIndexOf('/');
    if (slash < 0) return null;
    const feature = rel.slice(0, slash);
    if (!feature) return null;
    return `${feature}/${target}.json`;
  }

  return null;
}

function segmentTargetFromRef(
  ref: { locale: string; relativePath: string; absolutePath: string },
  role: LocaleSegmentWriteTarget['role'],
): LocaleSegmentWriteTarget {
  return {
    locale: normalizeLanguageCode(ref.locale),
    relativePath: ref.relativePath,
    absolutePath: ref.absolutePath,
    role,
  };
}

function deriveTargetSegmentFromSource(
  ctx: CoreContext,
  layout: ReturnType<typeof resolveLocalesLayoutFromContext>,
  targetLocale: string,
): LocaleSegmentWriteTarget {
  const sourceRef = localeSegmentRefFromAbsolute({
    layout,
    path: ctx.adapters.path,
    absolutePath: ctx.adapters.path.resolve(ctx.paths.sourceLocale),
  });
  if (sourceRef === null) {
    throw new I18nPruneError(
      `generate: source locale path does not match layout mode=${layout.mode} structure=${layout.structure}: ${ctx.paths.sourceLocale}`,
      'USAGE',
    );
  }

  const nextRelative = swapLocaleInSegmentRelativePath({
    structure: layout.structure,
    relativePath: sourceRef.relativePath,
    targetLocale,
  });
  if (nextRelative === null) {
    throw new I18nPruneError(
      `generate: cannot derive target segment from source ${sourceRef.relativePath} for structure=${layout.structure}`,
      'USAGE',
    );
  }

  const absolutePath = resolveLocaleSegmentAbsolutePath({
    layout,
    path: ctx.adapters.path,
    locale: targetLocale,
    segmentRelativePath: nextRelative,
  });

  return {
    locale: normalizeLanguageCode(targetLocale),
    relativePath: nextRelative,
    absolutePath,
    role: 'target',
  };
}

/** All on-disk segments for the configured source locale code. */
export function listSourceLocaleWriteTargets(ctx: CoreContext): LocaleSegmentWriteTarget[] {
  const source = sourceLocaleCodeFromContext(ctx);
  return segmentsForLocaleCode(ctx, source).map((s) => segmentTargetFromRef(s, 'source'));
}

/**
 * Resolve which segment file(s) generate should use for a target locale.
 *
 * @remarks One row per source segment (mirrored path shape). `flat_file` keeps a single segment.
 */
export function resolveTargetLocaleWritePlan(ctx: CoreContext, targetLocale: string): LocaleSegmentWritePlan {
  const layout = resolveLocalesLayoutFromContext(ctx);
  const target = normalizeLanguageCode(targetLocale);
  const { fs } = ctx.adapters;

  if (layout.mode === 'flat_file') {
    const existing = segmentsForLocaleCode(ctx, target);
    if (existing.length > 0) {
      const primary = primarySegmentForLocale(ctx, target)!;
      const segments = [segmentTargetFromRef(primary, 'existing_target')];
      return {
        targetLocale: target,
        layout,
        segments,
        missingSegments: existsRuntimeFsSync(primary.absolutePath, fs) ? [] : segments,
      };
    }
    const derived = deriveTargetSegmentFromSource(ctx, layout, target);
    const missingSegments = existsRuntimeFsSync(derived.absolutePath, fs) ? [] : [derived];
    return { targetLocale: target, layout, segments: [derived], missingSegments };
  }

  const sourceSegments = listSourceLocaleWriteTargets(ctx);
  const existingByRel = new Map(
    segmentsForLocaleCode(ctx, target).map((s) => [s.relativePath, s] as const),
  );

  const segments: LocaleSegmentWriteTarget[] = [];
  for (const src of sourceSegments) {
    const targetRel = swapLocaleInSegmentRelativePath({
      structure: layout.structure,
      relativePath: src.relativePath,
      targetLocale: target,
    });
    if (targetRel === null) {
      throw new I18nPruneError(
        `generate: cannot derive target segment from source ${src.relativePath} for structure=${layout.structure}`,
        'USAGE',
      );
    }
    const onDisk = existingByRel.get(targetRel);
    if (onDisk) {
      segments.push(segmentTargetFromRef(onDisk, 'existing_target'));
      continue;
    }
    const absolutePath = resolveLocaleSegmentAbsolutePath({
      layout,
      path: ctx.adapters.path,
      locale: target,
      segmentRelativePath: targetRel,
    });
    segments.push({
      locale: target,
      relativePath: targetRel,
      absolutePath,
      role: 'target',
    });
  }

  segments.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  const missingSegments = segments.filter((s) => !existsRuntimeFsSync(s.absolutePath, fs));
  return { targetLocale: target, layout, segments, missingSegments };
}

/** Absolute path for the primary segment file generate/resume writes for one target locale. */
export function resolvePrimaryTargetWritePath(ctx: CoreContext, targetLocale: string): string {
  const plan = resolveTargetLocaleWritePlan(ctx, targetLocale);
  const primary = plan.segments[0];
  if (!primary) {
    throw new I18nPruneError(`generate: no write path for target locale ${targetLocale}`, 'USAGE');
  }
  return primary.absolutePath;
}
