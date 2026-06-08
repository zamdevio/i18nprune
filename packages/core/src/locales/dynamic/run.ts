import { resolveProjectAnalysis } from '../../analysis/index.js';
import { ISSUE_SCAN_DYNAMIC_KEY_SITES } from '../../shared/constants/issueCodes.js';
import { issueCodeRepoDocPathForIssueCode } from '../../shared/docs/issueAnchors.js';
import { DEFAULT_LIST_TOP } from '../../shared/constants/listDisplay.js';
import { resolveListWindow, applyListWindow } from '../../shared/options/listWindow.js';
import { groupDynamicKeySites } from '../../extractor/dynamic/groups.js';
import type { CoreContext } from '../../types/context/index.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type {
  DynamicHostHooks,
  DynamicJsonPayload,
  DynamicRunOptions,
  DynamicRunResult,
} from '../../types/locales/index.js';
import type { OperationId } from '../../types/shared/run/index.js';
import { sourceLocaleCodeFromContext } from '../../shared/locales/targets/context.js';

const DYNAMIC_OP: OperationId = 'locales-dynamic';
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
    { defaultTop: DEFAULT_LIST_TOP },
  );
  const shownSites = applyListWindow(allSites, window);

  const sourceLocaleCode = sourceLocaleCodeFromContext(ctx);

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
      groups: groupDynamicKeySites(allSites),
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
