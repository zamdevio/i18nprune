import { resolveLocaleMetaProfile } from '../metaProfile.js';
import type { LocaleMetaProfile } from '../metaProfile.js';
import type { CoreContext } from '../../types/generate/index.js';
import type { Issue } from '../../types/json/envelope/index.js';

export type EditTargetFields = {
  target: string;
  englishName: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
};

export type EditResultRow = {
  target: string;
  profileSource: 'meta' | 'catalog';
  before: { englishName: string; nativeName: string; direction: 'ltr' | 'rtl' };
  after: { englishName: string; nativeName: string; direction: 'ltr' | 'rtl' };
  metaPath: string;
};

export type EditJsonPayload = {
  kind: 'locales-edit';
  target: string | null;
  targets: string[];
  skippedTargets: string[];
  updated: number;
  mode: 'meta_updated';
  profileSource: 'meta' | 'catalog';
  before: { englishName: string; nativeName: string; direction: 'ltr' | 'rtl' } | null;
  after: { englishName: string; nativeName: string; direction: 'ltr' | 'rtl' } | null;
  metaPath: string | null;
  rows: EditResultRow[];
  supportsAutoPatching: true;
};

export type EditRunResult = {
  payload: EditJsonPayload;
  issues: Issue[];
};

/**
 * Resolve the current metadata profile for a locale target.
 *
 * Returns the before-state so the CLI can prompt for overrides before
 * calling {@link writeLocaleMetaEdit}.
 */
export function resolveLocaleEditProfile(
  ctx: CoreContext,
  target: string,
): LocaleMetaProfile {
  return resolveLocaleMetaProfile(
    { fs: ctx.adapters.fs, path: ctx.adapters.path },
    ctx.paths.localesDir,
    target,
  );
}

/**
 * Write locale metadata for one or more targets and build the edit payload.
 *
 * The CLI resolves targets and prompts for field values; core owns the
 * metadata write and payload assembly. No `process.*` access.
 */
export function writeLocaleMetaEdit(
  ctx: CoreContext,
  edits: EditTargetFields[],
  skippedTargets: string[],
): EditRunResult {
  const rows: EditResultRow[] = [];

  for (const edit of edits) {
    const profile = resolveLocaleMetaProfile(
      { fs: ctx.adapters.fs, path: ctx.adapters.path },
      ctx.paths.localesDir,
      edit.target,
    );
    const before = {
      englishName: profile.englishName,
      nativeName: profile.nativeName,
      direction: profile.direction,
    };

    const metaContent = JSON.stringify(
      {
        lang: edit.target,
        englishName: edit.englishName,
        nativeName: edit.nativeName,
        direction: edit.direction,
      },
      null,
      2,
    ) + '\n';
    ctx.adapters.fs.writeText(profile.metaPath, metaContent);

    rows.push({
      target: edit.target,
      profileSource: profile.source,
      before,
      after: {
        englishName: edit.englishName,
        nativeName: edit.nativeName,
        direction: edit.direction,
      },
      metaPath: profile.metaPath,
    });
  }

  const targets = edits.map((e) => e.target);
  const firstRow = rows[0];
  const payload: EditJsonPayload = {
    kind: 'locales-edit',
    target: targets.length === 1 ? targets[0] : null,
    targets,
    skippedTargets,
    updated: rows.length,
    mode: 'meta_updated',
    profileSource: firstRow?.profileSource ?? 'catalog',
    before: targets.length === 1 ? firstRow?.before ?? null : null,
    after: targets.length === 1 ? firstRow?.after ?? null : null,
    metaPath: targets.length === 1 ? firstRow?.metaPath ?? null : null,
    rows,
    supportsAutoPatching: true,
  };

  return { payload, issues: [] };
}
