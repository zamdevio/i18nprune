import path from 'node:path';
import { runReview } from '@i18nprune/core';
import { formatListShownOmitted } from '@i18nprune/core';
import { style } from '@/utils/style/index.js';
import { resolveKitsBundle, assertKitsReadiness } from '@/commands/kits/lib/context.js';
import { flattenLocaleLeafValues, readLocaleJson } from '@/commands/kits/lib/locale.js';
import {
  emitKitsFailure,
  emitKitsJsonResult,
  finishKitsRun,
  formatKitsHumanText,
  logKitsSavedBaseline,
} from '@/commands/kits/lib/emit.js';
import {
  formatKitsHeadingMd,
  formatKitsHeadingTerminal,
  formatKitsIdenticalRowTerminal,
  formatKitsListOmittedTerminal,
  formatKitsMetricMd,
  formatKitsMetricTerminal,
} from '@/commands/kits/lib/humanFormat.js';
import { evaluateKitsPolicy, parseFailOnList } from '@/commands/kits/lib/policy.js';
import { resolveKitsListWindow, listModeLabel } from '@/commands/kits/lib/list.js';
import { saveKitsBaselineReport } from '@/commands/kits/lib/baseline.js';
import type { KitsIdenticalOptions } from '@/types/command/kits/index.js';

type ReviewPayload = {
  sourceLocale?: string;
  localesDir?: string;
  locales?: Record<string, { englishIdentical?: number }>;
};

type ParityPolicy = {
  excludeKeys?: string[];
  excludePrefixes?: string[];
  excludeValues?: string[];
};

const EMPTY_IDENTICAL = {
  kind: 'kits-identical' as const,
  sourceLocale: 'en',
  parityExcludesApplied: true,
  sourcePath: '',
  totalSourceIdentical: 0,
  listMode: 'top 3',
  locales: [],
  issues: [],
};

function shouldExclude(leafPath: string, value: string, parity: ParityPolicy | undefined): boolean {
  if (!parity) return false;
  if (parity.excludeKeys?.includes(leafPath)) return true;
  if (parity.excludePrefixes?.some((p) => leafPath === p || leafPath.startsWith(p))) return true;
  if (parity.excludeValues?.includes(value)) return true;
  return false;
}

export async function kitsIdentical(opts: KitsIdenticalOptions): Promise<void> {
  let ctx: Awaited<ReturnType<typeof resolveKitsBundle>> | undefined;
  try {
    const bundle = await resolveKitsBundle();
    ctx = bundle;
    if (
      !assertKitsReadiness('kits-identical', bundle, EMPTY_IDENTICAL, {
        sourceIdentical: 0,
      })
    ) {
      return;
    }
    const { ctx: context, coreCtx, projectRoot } = bundle;
    const listWindow = resolveKitsListWindow(context.config);
    const out = runReview(coreCtx, { target: opts.target }, {});
    const payload = out.payload as ReviewPayload;
    const sourceCode = payload.sourceLocale ?? 'en';
    const localesDir = payload.localesDir ?? context.paths.localesDir;
    const sourcePath = path.resolve(localesDir, `${sourceCode}.json`);
    const sourceMap = flattenLocaleLeafValues(readLocaleJson(sourcePath));
    const parity = (context.config as { policies?: { parity?: ParityPolicy } }).policies?.parity;

    const report = Object.keys(payload.locales ?? {}).map((file) => {
      const targetPath = path.resolve(localesDir, file);
      const targetMap = flattenLocaleLeafValues(readLocaleJson(targetPath));
      const identical: Array<{ path: string; value: string }> = [];

      for (const [leafPath, sourceValue] of Object.entries(sourceMap)) {
        const targetValue = targetMap[leafPath];
        if (targetValue !== undefined && targetValue === sourceValue) {
          if (!opts.raw && shouldExclude(leafPath, sourceValue, parity)) continue;
          identical.push({ path: leafPath, value: sourceValue });
        }
      }

      const listed = listWindow.full ? identical : identical.slice(0, listWindow.top);
      return {
        file,
        localeCode: file.replace(/\.json$/i, ''),
        identicalCount: identical.length,
        identicalPaths: listed,
        listedCount: listed.length,
      };
    });

    const total = report.reduce((sum, item) => sum + item.identicalCount, 0);
    const failOn = opts.strict ? [...parseFailOnList(opts.failOn), 'source-identical'] : parseFailOnList(opts.failOn);
    const policyReasons = evaluateKitsPolicy(
      { sourceIdenticalLeaves: total, issuesCount: out.issues.length },
      failOn,
    );

    const data = {
      kind: 'kits-identical' as const,
      sourceLocale: sourceCode,
      parityExcludesApplied: !opts.raw,
      sourcePath,
      totalSourceIdentical: total,
      listMode: listModeLabel(listWindow.full, listWindow.top),
      locales: report,
      issues: out.issues,
      policy: { failOn, reasons: policyReasons },
    };

    const mdLines: string[] = [
      formatKitsHeadingMd(2, 'Source-identical leaves'),
      '',
      formatKitsMetricMd('Source locale', sourceCode),
      formatKitsMetricMd('Total source-identical leaves', total),
      formatKitsMetricMd('List mode', data.listMode),
    ];
    const terminalLines: string[] = [
      formatKitsHeadingTerminal('Source-identical leaves'),
      '',
      formatKitsMetricTerminal('Source locale', sourceCode),
      formatKitsMetricTerminal('Total source-identical leaves', total),
      formatKitsMetricTerminal('List mode', data.listMode),
    ];
    for (const locale of report) {
      mdLines.push('', `### ${locale.localeCode}`, '', formatKitsMetricMd('count', locale.identicalCount), '');
      terminalLines.push('', style.bold(`[${locale.localeCode}] ${locale.file}`), formatKitsMetricTerminal('count', locale.identicalCount));
      for (const row of locale.identicalPaths) {
        mdLines.push(`- \`${row.path}\` = ${JSON.stringify(row.value)}`);
        terminalLines.push(formatKitsIdenticalRowTerminal(row.path, row.value));
      }
      const omitted = locale.identicalCount - locale.listedCount;
      if (omitted > 0) {
        const prefix = `  · ${String(locale.listedCount)} path(s) shown for ${locale.localeCode}`;
        mdLines.push(formatListShownOmitted(prefix, omitted));
        terminalLines.push(formatKitsListOmittedTerminal(prefix, omitted));
      }
    }
    if (policyReasons.length > 0) {
      mdLines.push('', `> Policy failure: ${policyReasons.join('; ')}`);
      terminalLines.push('', style.err(`${style.bold('Policy failure')}: ${policyReasons.join('; ')}`));
    }
    const markdown = mdLines.join('\n');
    const terminal = terminalLines.join('\n');

    if (opts.saveBaseline) {
      const saveContent = context.run.json
        ? emitKitsJsonResult('kits-identical', data, context, { issues: data.issues })
        : formatKitsHumanText(markdown);
      const saved = saveKitsBaselineReport(projectRoot, opts.saveBaseline, saveContent, context.run.json);
      logKitsSavedBaseline(saved, context);
    }

    finishKitsRun('kits-identical', context, {
      data,
      outPath: opts.out,
      issues: data.issues,
      markdownText: markdown,
      terminalText: terminal,
      summaryCounts: { sourceIdentical: total },
      policyFailed: policyReasons.length > 0,
    });
  } catch (err) {
    if (!ctx) throw err;
    emitKitsFailure('kits-identical', EMPTY_IDENTICAL, ctx.ctx, err);
  }
}
