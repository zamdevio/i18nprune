import { existsRuntimeFsSync } from '../runtime/helpers/sync/fs.js';
import { writeLocaleJsonFromContextSync } from '../shared/locales/index.js';
import { isAllLocaleToken, parseLocaleCodesList } from '../locales/targets.js';
import {
  buildLanguageCatalog,
  generatedLanguageCatalog,
  getLanguageByCodeFromCatalog,
} from '../shared/languages/catalog/index.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';
import { MAX_MISSING_TARGET_SUGGESTIONS } from '../shared/constants/missing.js';
import { DEFAULT_LIST_TOP, formatListOmittedSuffix } from '../shared/constants/listDisplay.js';
import { I18nPruneError } from '../shared/errors/index.js';
import { readLocaleSegmentFromContext } from '../shared/locales/read/index.js';
import {
  primarySegmentForLocale,
  segmentsForLocaleCode,
  sourceLocaleCodeFromContext,
  targetLocaleCodesFromContext,
} from '../shared/locales/targets/index.js';
import { emitRunMessage } from '../shared/run/index.js';
import { resolveProjectAnalysis } from '../analysis/index.js';
import {
  detectLocalePlaceholderLeaves,
  formatSourcePlaceholderMessage,
  formatTargetPlaceholderMessage,
  issuesFromSourcePlaceholderLeaves,
  issuesFromTargetPlaceholderLeaves,
  sourcePlaceholderValues,
} from '../shared/sourcePlaceholders/index.js';
import {
  ISSUE_LOCALE_TARGET_NOT_FOUND,
  ISSUE_IO_READ_FAILED,
  ISSUE_MISSING_PATHS_NOT_IN_SCAN,
  ISSUE_SCAN_DYNAMIC_KEY_SITES,
} from '../shared/constants/issueCodes.js';
import { readLocaleLeavesForCode, readSourceLocaleLeaves } from '../shared/locales/surface/localeSurface.js';
import { resolveMissingPathsPlan } from './resolvePaths.js';
import { applyMissingPaths } from './apply.js';
import { createMissingWritePlan, writeMissingWritePlan } from './writePlan.js';
import type { CoreContext } from '../types/context/index.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { LocalePlaceholderLeaf, SourcePlaceholderLeaf } from '../shared/sourcePlaceholders/index.js';
import type { RunMessageLevel } from '../types/shared/run/index.js';
import type {
  MissingHostHooks,
  MissingJsonOutput,
  MissingPlaceholderLeaf,
  MissingJsonTarget,
  MissingRunOptions,
  MissingRunResult,
  MissingSkippedTarget,
  MissingSegmentWrite,
  MissingTargetPlan,
  MissingTargetState,
  MissingWriteInput,
} from '../types/missing/index.js';

function emitMissingMessage(
  host: Pick<MissingHostHooks, 'emit' | 'runId'>,
  input: {
    level: RunMessageLevel;
    message: string;
    target?: string;
    path?: string;
    data?: Record<string, string | number | boolean | null>;
  },
): void {
  emitRunMessage(host.emit, { op: 'missing', runId: host.runId, ...input });
}

function compactLocaleCode(code: string): string {
  return normalizeLanguageCode(code).replace(/[^a-z0-9]/g, '');
}

function suggestExistingLocaleTargets(input: string, existingCodes: readonly string[]): string[] {
  const normalizedInput = normalizeLanguageCode(input);
  const compactInput = compactLocaleCode(input);
  const normalizedExisting = [...existingCodes].map((code) => normalizeLanguageCode(code)).sort((a, b) => a.localeCompare(b));
  const existing = new Set(normalizedExisting);
  const out: string[] = [];
  const push = (code: string): void => {
    if (existing.has(code) && !out.includes(code)) out.push(code);
  };

  for (const code of normalizedExisting) {
    const compactCode = compactLocaleCode(code);
    if (compactInput.length > 0 && compactInput === compactCode) push(code);
    if (normalizedInput.length >= 2 && code.startsWith(normalizedInput.slice(0, 2))) push(code);
  }

  const catalog = buildLanguageCatalog(generatedLanguageCatalog);
  for (const row of catalog) {
    const rowCompact = compactLocaleCode(row.code);
    if (compactInput.length > 0 && compactInput === rowCompact) push(row.code);
    if (normalizedInput.length >= 2 && row.code.startsWith(normalizedInput.slice(0, 2))) push(row.code);
    if (normalizedInput.length >= 3) {
      const q = normalizedInput.toLowerCase();
      if (row.english.toLowerCase().startsWith(q) || row.native.toLowerCase().startsWith(q)) {
        push(row.code);
      }
    }
  }

  return out.slice(0, MAX_MISSING_TARGET_SUGGESTIONS);
}

function relativeDisplayPath(ctx: CoreContext, targetPath: string): string {
  const cwd = ctx.adapters.system.cwd();
  const rel = ctx.adapters.path.relative(cwd, targetPath);
  if (rel === '') return ctx.adapters.path.basename(targetPath).replace(/\\/g, '/');
  if (rel.startsWith('..')) return rel.replace(/\\/g, '/');
  return rel.replace(/\\/g, '/');
}

function localeEnglishName(code: string): string {
  const catalog = buildLanguageCatalog(generatedLanguageCatalog);
  return getLanguageByCodeFromCatalog(catalog, code)?.english ?? code;
}

function readTargetState(
  ctx: CoreContext,
  targetPath: string,
  targetKind: MissingTargetState['targetKind'],
  selectedLocaleCode?: string,
): MissingTargetState {
  const read = readLocaleSegmentFromContext(ctx, targetPath);
  if (!read.ok) {
    const message = read.diagnostics.map((d) => d.message).join(' · ') || 'failed to read locale JSON';
    throw new I18nPruneError(message, 'IO', { issueCode: ISSUE_IO_READ_FAILED });
  }
  const localeText = read.text;
  const localeJson = read.document;
  return {
    targetPath,
    targetKind,
    localeJson,
    localeText,
    ...(selectedLocaleCode !== undefined ? { selectedLocaleCode } : {}),
    ...(selectedLocaleCode !== undefined ? { selectedLocaleEnglishName: localeEnglishName(selectedLocaleCode) } : {}),
    targetDisplayPath: relativeDisplayPath(ctx, targetPath),
  };
}

function resolveSourceTargetState(ctx: CoreContext): MissingTargetState {
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  if (segmentsForLocaleCode(ctx, sourceCode).length === 0) {
    throw new I18nPruneError(`Source locale not found: ${ctx.paths.sourceLocale}`, 'USAGE');
  }
  const primary =
    primarySegmentForLocale(ctx, sourceCode) ?? segmentsForLocaleCode(ctx, sourceCode)[0];
  if (!primary) {
    throw new I18nPruneError(`Source locale not found: ${ctx.paths.sourceLocale}`, 'USAGE');
  }
  return readTargetState(ctx, primary.absolutePath, 'source', sourceCode);
}

function resolveLocaleTargetStates(ctx: CoreContext, rawTarget: string): {
  targets: MissingTargetState[];
  skippedTargets: MissingSkippedTarget[];
} {
  const localesDir = ctx.paths.localesDir;
  const fs = ctx.adapters.fs;
  if (!existsRuntimeFsSync(localesDir, fs)) {
    throw new I18nPruneError(`locales directory not found: ${localesDir}`, 'USAGE');
  }

  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const targetCodes = targetLocaleCodesFromContext(ctx);
  const requestedCodes = [
    ...new Set(
      isAllLocaleToken(rawTarget) ? targetCodes : parseLocaleCodesList(rawTarget).map((c) => normalizeLanguageCode(c)),
    ),
  ];
  const targets: MissingTargetState[] = [];
  const skippedTargets: MissingSkippedTarget[] = [];

  for (const code of requestedCodes) {
    const primary = primarySegmentForLocale(ctx, code);
    const targetPath = primary?.absolutePath ?? ctx.adapters.path.join(localesDir, `${code}.json`);
    if (code === sourceCode) {
      skippedTargets.push({ localeCode: code, targetPath, reason: 'source_locale' });
      continue;
    }
    const segments = segmentsForLocaleCode(ctx, code);
    if (segments.length === 0) {
      const suggestions = suggestExistingLocaleTargets(code, targetCodes);
      skippedTargets.push({
        localeCode: code,
        targetPath,
        reason: 'not_found',
        ...(suggestions.length > 0 ? { suggestions } : {}),
      });
      continue;
    }
    targets.push(readTargetState(ctx, targetPath, 'locale', code));
  }

  return { targets, skippedTargets };
}

function resolveMissingTargetStates(ctx: CoreContext, opts: MissingRunOptions): {
  targets: MissingTargetState[];
  skippedTargets: MissingSkippedTarget[];
} {
  const selected = opts.target?.trim();
  if (!selected) return { targets: [resolveSourceTargetState(ctx)], skippedTargets: [] };
  return resolveLocaleTargetStates(ctx, selected);
}

function issuesFromDynamicScanCount(count: number): Issue[] {
  if (count <= 0) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_SCAN_DYNAMIC_KEY_SITES,
      message: `${String(count)} translation call(s) use a non-literal key — static analysis cannot enumerate computed keys as fixed paths.`,
      docPath: 'dynamic/README',
    },
  ];
}

function issuesFromMissingSkippedNotInScan(skipped: readonly string[]): Issue[] {
  if (skipped.length === 0) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_MISSING_PATHS_NOT_IN_SCAN,
      message: `${String(skipped.length)} path(s) are not in the current code scan (ignored).`,
      docPath: 'commands/missing/README',
    },
  ];
}

function issuesFromSkippedTargets(skippedTargets: readonly MissingSkippedTarget[]): Issue[] {
  if (skippedTargets.length === 0) return [];
  return skippedTargets.map((target) => {
    const message =
      target.reason === 'source_locale'
        ? `missing: target "${target.localeCode}" is the source locale; omit --target to write the source locale.`
        : `missing: locale file not found for target "${target.localeCode}" (skipped).${target.suggestions?.length ? ` Did you mean: ${target.suggestions.join(', ')}?` : ''}`;
    return {
      severity: 'warning' as const,
      code: ISSUE_LOCALE_TARGET_NOT_FOUND,
      message,
      docPath: 'commands/missing/README',
    };
  });
}

function missingPlanSegmentWrites(entry: MissingTargetPlan): MissingSegmentWrite[] {
  if (entry.writePlan.length > 0) {
    return entry.writePlan;
  }
  return [
    {
      targetPath: entry.target.targetPath,
      relativePath:
        entry.target.targetDisplayPath ??
        entry.target.targetPath.split('/').pop() ??
        entry.target.targetPath,
      paths: [...entry.toAdd],
    },
  ];
}

function missingPlanFilesLabel(entry: MissingTargetPlan): string {
  const writes = missingPlanSegmentWrites(entry);
  if (writes.length === 1) {
    return writes[0]!.relativePath;
  }
  return `${String(writes.length)} segment files (${writes.map((w) => w.relativePath).join(', ')})`;
}

export function emitMissingTargetWriteIntro(host: Pick<MissingHostHooks, 'emit' | 'runId'>, entry: MissingTargetPlan): void {
  if (entry.target.targetKind !== 'locale' || entry.target.selectedLocaleCode === undefined) return;
  emitMissingMessage(host, {
    level: 'info',
    message: `target ${entry.target.selectedLocaleEnglishName ?? entry.target.selectedLocaleCode} (${entry.target.selectedLocaleCode}) has ${String(entry.toAdd.length)} missing path(s); preparing ${missingPlanFilesLabel(entry)}`,
    target: entry.target.selectedLocaleCode,
    path: entry.target.targetPath,
    data: { paths: entry.toAdd.length, segmentFiles: missingPlanSegmentWrites(entry).length },
  });
  const localeCode = entry.target.selectedLocaleCode;
  const filesLabel =
    missingPlanSegmentWrites(entry).length === 1
      ? missingPlanSegmentWrites(entry)[0]!.relativePath
      : `${localeCode} locale segment files`;
  emitMissingMessage(host, {
    level: 'warn',
    message: `writing ${filesLabel} — validate still compares code to the source locale file until it matches.`,
    target: localeCode,
    path: entry.target.targetPath,
  });
}

export function emitMissingTargetActionMessage(
  host: Pick<MissingHostHooks, 'emit' | 'runId'>,
  entry: MissingTargetPlan,
  action: 'would_add' | 'will_add' | 'added' | 'declined',
  placeholder?: string,
  preview?: { fullList: boolean; top?: number },
): void {
  if (action === 'declined') {
    emitMissingMessage(host, {
      level: 'info',
      message: `skipped ${missingPlanFilesLabel(entry)} (user declined).`,
      path: entry.target.targetPath,
    });
    return;
  }

  for (const write of missingPlanSegmentWrites(entry)) {
    const count = write.paths.length;
    if (action === 'would_add') {
      emitMissingMessage(host, {
        level: 'info',
        message: `would add ${String(count)} path(s) to ${write.relativePath} (placeholder ${JSON.stringify(placeholder ?? '')}):`,
        path: write.targetPath,
        data: { paths: count },
      });
    } else if (action === 'will_add') {
      emitMissingMessage(host, {
        level: 'info',
        message: `will add ${String(count)} path(s) to ${write.relativePath}:`,
        path: write.targetPath,
        data: { paths: count },
      });
    } else {
      emitMissingMessage(host, {
        level: 'info',
        message: `added ${String(count)} path(s) to ${write.relativePath}`,
        path: write.targetPath,
        data: { paths: count },
      });
    }
    if (preview) {
      emitMissingPathsPreview(host, { paths: write.paths, fullList: preview.fullList, top: preview.top });
    }
  }
}

export function emitMissingPathsPreview(
  host: Pick<MissingHostHooks, 'emit' | 'runId'>,
  input: { paths: readonly string[]; fullList: boolean; top?: number },
): void {
  const cap = input.top ?? DEFAULT_LIST_TOP;
  const visible = input.fullList ? input.paths : input.paths.slice(0, cap);
  for (const path of visible) {
    emitMissingMessage(host, { level: 'detail', message: `  ${path}`, path });
  }
  const omitted = input.fullList ? 0 : Math.max(0, input.paths.length - visible.length);
  if (omitted > 0) {
    emitMissingMessage(host, {
      level: 'detail',
      message: `  · ${String(visible.length)} key path(s) shown + ${formatListOmittedSuffix(omitted)}`,
      data: { omitted },
    });
  }
}

export function emitMissingPlaceholderLeavesPreview(
  host: Pick<MissingHostHooks, 'emit' | 'runId'>,
  input: { leaves: readonly MissingPlaceholderLeaf[]; fullList: boolean; top?: number },
): void {
  if (input.leaves.length === 0) return;
  const cap = input.top ?? DEFAULT_LIST_TOP;
  const visible = input.fullList ? input.leaves : input.leaves.slice(0, cap);
  emitMissingMessage(host, {
    level: 'info',
    message: `placeholder leaves found: ${String(input.leaves.length)}`,
    data: { placeholderLeaves: input.leaves.length },
  });
  let lastGroup = '';
  for (const leaf of visible) {
    const group = `${leaf.localeRole === 'source' ? 'source' : 'target'} ${leaf.localeCode} · ${leaf.file}`;
    if (group !== lastGroup) {
      emitMissingMessage(host, { level: 'detail', message: `  ${group}`, target: leaf.localeCode });
      lastGroup = group;
    }
    emitMissingMessage(host, {
      level: 'detail',
      message: `    · ${leaf.location} ${leaf.path}`,
      target: leaf.localeCode,
      path: leaf.file,
    });
  }
  const omitted = input.fullList ? 0 : Math.max(0, input.leaves.length - visible.length);
  if (omitted > 0) {
    emitMissingMessage(host, {
      level: 'detail',
      message: `  · ${String(visible.length)} placeholder leaf/leaves shown + ${formatListOmittedSuffix(omitted)}`,
      data: { omitted },
    });
  }
}

function relativeToCwd(ctx: CoreContext, filePath: string): string {
  const rel = ctx.adapters.path.relative(ctx.adapters.system.cwd(), filePath);
  const display = rel || filePath;
  return display.replace(/\\/g, '/');
}

function missingPayloadListWindow(opts: MissingRunOptions): { full: boolean; limit: number } {
  return { full: opts.full === true, limit: opts.top ?? DEFAULT_LIST_TOP };
}

function locatePlaceholderLine(text: string, path: string, value: string): number | null {
  const key = path.split('.').at(-1);
  if (key === undefined || key.length === 0) return null;
  const keyNeedle = JSON.stringify(key);
  const valueNeedle = JSON.stringify(value);
  const lines = text.split(/\r?\n/);
  const matches: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.includes(keyNeedle) && line.includes(valueNeedle)) {
      matches.push(i + 1);
    }
  }
  if (matches.length === 1) return matches[0]!;
  if (matches.length > 1) return matches[0]!;
  return null;
}

function placeholderLeafForTarget(
  ctx: CoreContext,
  target: MissingTargetState,
  leaf: LocalePlaceholderLeaf,
): MissingPlaceholderLeaf {
  const file = target.targetDisplayPath ?? relativeToCwd(ctx, target.targetPath);
  const line = locatePlaceholderLine(target.localeText, leaf.path, leaf.value);
  return {
    localeRole: target.targetKind,
    localeCode: leaf.localeCode,
    file,
    path: leaf.path,
    value: leaf.value,
    line,
    location: line === null ? file : `${file}:${String(line)}`,
  };
}

/** Write missing paths using per-segment planning (multi-segment layouts). */
export function writeMissingPaths(ctx: CoreContext, input: MissingWriteInput): void {
  const localeCode = input.localeCode ?? sourceLocaleCodeFromContext(ctx);
  const plan =
    input.writePlan ?? createMissingWritePlan(ctx, localeCode, input.paths);
  if (plan.length > 0) {
    writeMissingWritePlan(ctx, plan, input.placeholder);
    return;
  }
  const next = applyMissingPaths({ localeJson: input.localeJson, paths: input.paths, placeholder: input.placeholder });
  writeLocaleJsonFromContextSync(ctx, input.targetPath, next);
}

export function runMissing(
  ctx: CoreContext,
  opts: MissingRunOptions,
  host: MissingHostHooks,
): MissingRunResult {
  const { targets: targetStates, skippedTargets } = resolveMissingTargetStates(ctx, opts);
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const sourceTargetState =
    targetStates.find((target) => target.targetKind === 'source') ?? resolveSourceTargetState(ctx);
  const analysis = resolveProjectAnalysis(ctx, { emit: host.emit, op: 'missing', runId: host.runId });
  const resolvedKeys = analysis.usage.resolvedKeys;
  const targets = targetStates.map((target) => {
    const localeCode = target.selectedLocaleCode ?? sourceCode;
    const localeLeaves = readLocaleLeavesForCode(ctx, localeCode);
    const { toAdd, skippedNotInScan } = resolveMissingPathsPlan({
      localeLeaves,
      resolvedKeys,
    });
    const writePlan = createMissingWritePlan(ctx, localeCode, toAdd);
    return { target, toAdd, skippedNotInScan, writePlan };
  });
  const placeholderValues = sourcePlaceholderValues(ctx.config.missing?.placeholder);
  const sourcePlaceholderLeaves: SourcePlaceholderLeaf[] = [];
  const targetPlaceholderLeaves: LocalePlaceholderLeaf[] = [];
  const placeholderListTargets = [
    sourceTargetState,
    ...targetStates.filter((target) => target.targetKind !== 'source'),
  ];
  const placeholderLeaves: MissingPlaceholderLeaf[] = [];
  for (const target of placeholderListTargets) {
    const localeCode = target.selectedLocaleCode ?? sourceCode;
    const surfaceLeaves =
      target.targetKind === 'source'
        ? readSourceLocaleLeaves(ctx)
        : readLocaleLeavesForCode(ctx, localeCode);
    const leaves = detectLocalePlaceholderLeaves({
      leaves: surfaceLeaves,
      placeholderValues,
      localeRole: target.targetKind === 'source' ? 'source' : 'target',
      localeCode,
      localePath: target.targetPath,
    });
    if (target.targetKind === 'source') {
      sourcePlaceholderLeaves.push(...leaves.map((leaf) => ({ path: leaf.path, value: leaf.value })));
    } else {
      targetPlaceholderLeaves.push(...leaves);
    }
    placeholderLeaves.push(...leaves.map((leaf) => placeholderLeafForTarget(ctx, target, leaf)));
  }
  const dynamicSites = analysis.dynamicSites.length;
  if (dynamicSites > 0) {
    emitMissingMessage(host, {
      level: 'warn',
      message: `${String(dynamicSites)} translation call(s) use a non-literal key — missing only adds paths for literal keys seen in the scan; use \`validate\` or \`locales dynamic\` for dynamic call sites.`,
      data: { dynamicSites },
    });
  }
  if (sourcePlaceholderLeaves.length > 0) {
    emitMissingMessage(host, {
      level: 'warn',
      message: formatSourcePlaceholderMessage({
        count: sourcePlaceholderLeaves.length,
        samplePaths: sourcePlaceholderLeaves.slice(0, 5).map((leaf) => leaf.path),
      }),
      data: { sourcePlaceholderLeaves: sourcePlaceholderLeaves.length },
    });
  }
  if (targetPlaceholderLeaves.length > 0) {
    const byLocale = new Map<string, LocalePlaceholderLeaf[]>();
    for (const leaf of targetPlaceholderLeaves) {
      byLocale.set(leaf.localeCode, [...(byLocale.get(leaf.localeCode) ?? []), leaf]);
    }
    for (const [localeCode, leaves] of byLocale) {
      emitMissingMessage(host, {
        level: 'warn',
        message: formatTargetPlaceholderMessage({
          count: leaves.length,
          samplePaths: leaves.slice(0, 5).map((leaf) => leaf.path),
          targetLabel: localeCode,
        }),
        target: localeCode,
        data: { targetPlaceholderLeaves: leaves.length },
      });
    }
  }
  const targetPayloads: MissingJsonTarget[] = targets.map((entry) => {
    const segmentPaths = missingPlanSegmentWrites(entry).map((write) => relativeToCwd(ctx, write.targetPath));
    return {
      targetPath: segmentPaths[0] ?? relativeToCwd(ctx, entry.target.targetPath),
      ...(segmentPaths.length > 1 ? { targetPaths: segmentPaths } : {}),
      targetKind: entry.target.targetKind,
      ...(entry.target.targetKind === 'locale' && entry.target.selectedLocaleCode !== undefined
        ? { selectedLocaleCode: entry.target.selectedLocaleCode }
        : {}),
      pathsAdded: entry.toAdd.length,
      paths: entry.toAdd,
      skippedNotInScan: entry.skippedNotInScan,
    };
  });
  const aggregatePaths = [...new Set(targets.flatMap((entry) => entry.toAdd))];
  const aggregateSkippedNotInScan = [...new Set(targets.flatMap((entry) => entry.skippedNotInScan))];
  for (const skipped of skippedTargets) {
    if (skipped.reason === 'source_locale') {
      emitMissingMessage(host, {
        level: 'warn',
        message: `target "${skipped.localeCode}" is the source locale; omit --target to write the source locale file.`,
        target: skipped.localeCode,
        path: skipped.targetPath,
      });
    } else {
      const hint = skipped.suggestions?.length ? ` Did you mean: ${skipped.suggestions.join(', ')}?` : '';
      emitMissingMessage(host, {
        level: 'warn',
        message: `target locale not found for "${skipped.localeCode}" (${skipped.targetPath}) — skipped.${hint}`,
        target: skipped.localeCode,
        path: skipped.targetPath,
      });
    }
  }
  if (aggregateSkippedNotInScan.length > 0) {
    emitMissingMessage(host, {
      level: 'detail',
      message: `${String(aggregateSkippedNotInScan.length)} path(s) not in current code scan (ignored).`,
      data: { paths: aggregateSkippedNotInScan.length },
    });
  }
  if (targets.reduce((sum, entry) => sum + entry.toAdd.length, 0) === 0) {
    emitMissingMessage(host, {
      level: 'info',
      message:
        targets.length === 0
          ? 'nothing to add (no matching target locale files found).'
          : 'nothing to add (all scanned keys already present in target JSON).',
    });
  }
  const firstTarget = targetPayloads[0];
  const listWindow = missingPayloadListWindow(opts);
  const visibleAggregatePaths = listWindow.full ? aggregatePaths : aggregatePaths.slice(0, listWindow.limit);
  const shownPlaceholderLeaves = listWindow.full
    ? placeholderLeaves
    : placeholderLeaves.slice(0, listWindow.limit);
  const payload: MissingJsonOutput = {
    kind: 'missing',
    targetPath: firstTarget?.targetPath ?? '',
    ...(firstTarget?.targetPaths !== undefined ? { targetPaths: firstTarget.targetPaths } : {}),
    targetKind: firstTarget?.targetKind ?? 'locale',
    pathsAdded: targets.reduce((sum, entry) => sum + entry.toAdd.length, 0),
    shown: visibleAggregatePaths.length,
    top: listWindow.full ? null : listWindow.limit,
    full: listWindow.full,
    paths: visibleAggregatePaths,
    dryRun: Boolean(opts.dryRun),
    skippedNotInScan: aggregateSkippedNotInScan,
    targets: targetPayloads.map((target) => ({
      ...target,
      paths: listWindow.full ? target.paths : target.paths.slice(0, listWindow.limit),
    })),
    skippedTargets: skippedTargets.map((target) => ({
      ...target,
      targetPath: relativeToCwd(ctx, target.targetPath),
    })),
    placeholderLeaves: {
      count: placeholderLeaves.length,
      shown: shownPlaceholderLeaves.length,
      top: listWindow.full ? null : listWindow.limit,
      full: listWindow.full,
      leaves: shownPlaceholderLeaves,
    },
  };
  const issues = [
    ...issuesFromDynamicScanCount(dynamicSites),
    ...issuesFromMissingSkippedNotInScan(aggregateSkippedNotInScan),
    ...issuesFromSkippedTargets(skippedTargets),
    ...issuesFromSourcePlaceholderLeaves(sourcePlaceholderLeaves),
    ...issuesFromTargetPlaceholderLeaves(targetPlaceholderLeaves),
  ];

  return {
    payload,
    issues,
    targets,
    skippedTargets,
    toAdd: aggregatePaths,
    skippedNotInScan: aggregateSkippedNotInScan,
    dynamicSites,
    keyObservationsCount: analysis.keyObservations.length,
    placeholderLeaves,
  };
}
