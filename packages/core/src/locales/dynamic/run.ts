import { resolveProjectAnalysis } from '../../analysis/index.js';
import { ISSUE_SCAN_DYNAMIC_KEY_SITES } from '../../shared/constants/issueCodes.js';
import { issueCodeRepoDocPathForIssueCode } from '../../shared/docs/issueAnchors.js';
import { resolveListWindow, applyListWindow } from '../../shared/options/listWindow.js';
import type { CoreContext } from '../../types/generate/index.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { DynamicKeySite } from '../../types/extractor/dynamic/index.js';
import type { RunEmitter, OperationId } from '../../types/shared/run/index.js';

export type DynamicRunOptions = {
  top?: number;
  full?: boolean;
};

export type DynamicHostHooks = {
  emit?: RunEmitter;
  runId?: string;
};

export type DynamicJsonPayload = {
  kind: 'locales-dynamic';
  sourceLocalePath: string;
  sourceLocaleCode: string;
  top: number | null;
  full: boolean;
  shown: number;
  dynamic: {
    count: number;
    sites: DynamicKeySite[];
  };
};

export type DynamicRunResult = {
  payload: DynamicJsonPayload;
  issues: Issue[];
  allSites: DynamicKeySite[];
};

const DYNAMIC_OP: OperationId = 'locales-dynamic';
const DYNAMIC_DEFAULT_TOP = 10;

/**
 * Core entry for the `locales dynamic` operation.
 *
 * Lists non-literal translation key call sites from project analysis,
 * applies list-window shaping, and returns a structured payload.
 * No `process.*` access, no file writes.
 *
 * @param ctx  - Core context providing project paths, config, and adapters.
 * @param opts - List-window options (`top`, `full`).
 * @param host - Optional host hooks for cache event emission.
 * @returns Structured `{ payload, issues, allSites }`.
 */
export function runDynamic(
  ctx: CoreContext,
  opts: DynamicRunOptions,
  host: DynamicHostHooks = {},
): DynamicRunResult {
  const analysis = resolveProjectAnalysis(ctx, {
    emit: host.emit,
    op: DYNAMIC_OP,
    runId: host.runId,
  });
  const allSites = analysis.dynamicSites;

  const window = resolveListWindow(
    { top: opts.top, full: opts.full },
    { defaultTop: DYNAMIC_DEFAULT_TOP },
  );
  const shownSites = applyListWindow(allSites, window);

  const sourceLocaleCode = ctx.adapters.path.basename(ctx.paths.sourceLocale, '.json');

  const payload: DynamicJsonPayload = {
    kind: 'locales-dynamic',
    sourceLocalePath: ctx.paths.sourceLocale,
    sourceLocaleCode,
    top: window.full ? null : window.limit,
    full: window.full,
    shown: shownSites.length,
    dynamic: {
      count: allSites.length,
      sites: shownSites,
    },
  };

  const issues = buildDynamicIssues(allSites.length);
  return { payload, issues, allSites };
}

function buildDynamicIssues(dynamicCount: number): Issue[] {
  if (dynamicCount === 0) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_SCAN_DYNAMIC_KEY_SITES,
      message: `${String(dynamicCount)} translation call(s) use a non-literal key — static analysis cannot enumerate computed keys as fixed paths.`,
      docPath: issueCodeRepoDocPathForIssueCode(ISSUE_SCAN_DYNAMIC_KEY_SITES),
    },
  ];
}
