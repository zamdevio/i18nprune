import { runDynamic, runQuality, runValidate } from '@i18nprune/core';
import { resolveKitsBundle } from '@/commands/kits/lib/context.js';
import {
  emitKitsFailure,
  emitKitsJsonResult,
  finishKitsRun,
  formatKitsHumanText,
  logKitsSavedBaseline,
} from '@/commands/kits/lib/emit.js';
import {
  formatKitsBlockquoteMd,
  formatKitsBlockquoteTerminal,
  formatKitsDynamicGroupsMd,
  formatKitsDynamicGroupsTerminal,
  formatKitsDynamicSampleTerminal,
  formatKitsDynamicSamplesSectionMd,
  formatKitsHeadingMd,
  formatKitsHeadingTerminal,
  formatKitsListOmittedTerminal,
  formatKitsMetricMd,
  formatKitsMetricTerminal,
} from '@/commands/kits/lib/humanFormat.js';
import { resolveKitsListWindow, listModeLabel } from '@/commands/kits/lib/list.js';
import { saveKitsBaselineReport } from '@/commands/kits/lib/baseline.js';
import type { KitsPrOptions } from '@/types/command/kits/index.js';

const EMPTY_PR = {
  kind: 'kits-pr' as const,
  summary: { missingLiteralKeys: 0, dynamic: 0, sourceIdentical: 0 },
  groups: {},
  focusedCount: 0,
  listedCount: 0,
  listMode: 'top 3',
  sites: [],
  issues: [],
};

export async function kitsPr(opts: KitsPrOptions): Promise<void> {
  let ctx: Awaited<ReturnType<typeof resolveKitsBundle>> | undefined;
  try {
    const bundle = await resolveKitsBundle();
    ctx = bundle;
    const { ctx: context, coreCtx, projectRoot } = bundle;
    const listWindow = resolveKitsListWindow(context.config);

    const v = runValidate(coreCtx, {}, {});
    const d = runDynamic(coreCtx, { full: true, top: 5000 }, {});
    const q = runQuality(coreCtx, { target: opts.target }, {});

    const summary = {
      missingLiteralKeys: (v.payload as { summary?: { missing?: unknown[] } }).summary?.missing?.length ?? 0,
      dynamic: (d.payload as { dynamic?: { count?: number } }).dynamic?.count ?? 0,
      sourceIdentical: (q.payload as { total?: number }).total ?? 0,
    };
    const groups = (d.payload as { dynamic?: { groups?: Record<string, number> } }).dynamic?.groups ?? {};
    const sites =
      (d.payload as { dynamic?: { sites?: Array<{ kind?: string; filePath?: string; line?: number; preview?: string }> } })
        .dynamic?.sites ?? [];
    const focused = opts.focus
      ? sites.filter((s) =>
          `${s.filePath ?? ''} ${s.preview ?? ''}`.toLowerCase().includes(opts.focus!.toLowerCase()),
        )
      : sites;
    const listed = listWindow.full ? focused : focused.slice(0, listWindow.top);
    const samplesTitle = `Dynamic samples${listWindow.full ? ' (full)' : ` (${listModeLabel(listWindow.full, listWindow.top)})`}`;

    const markdown = [
      formatKitsHeadingMd(2, 'i18nprune Audit'),
      '',
      formatKitsMetricMd('Missing literal keys', summary.missingLiteralKeys),
      formatKitsMetricMd('Dynamic key sites', summary.dynamic),
      formatKitsMetricMd('Source-identical leaves', summary.sourceIdentical),
      '',
      formatKitsDynamicGroupsMd(groups),
      '',
      formatKitsBlockquoteMd(
        'Dynamic sites are non-literal — missing=0 does not mean dynamic prefixes are fully translated.',
      ),
      '',
      ...formatKitsDynamicSamplesSectionMd({
        title: samplesTitle,
        sites: listed,
        shownCount: listed.length,
        totalCount: focused.length,
      }),
    ].join('\n');

    const terminal = [
      formatKitsHeadingTerminal('i18nprune Audit'),
      '',
      formatKitsMetricTerminal('Missing literal keys', summary.missingLiteralKeys),
      formatKitsMetricTerminal('Dynamic key sites', summary.dynamic),
      formatKitsMetricTerminal('Source-identical leaves', summary.sourceIdentical),
      '',
      formatKitsDynamicGroupsTerminal(groups),
      '',
      formatKitsBlockquoteTerminal(
        'Dynamic sites are non-literal — missing=0 does not mean dynamic prefixes are fully translated.',
      ),
      '',
      formatKitsHeadingTerminal(samplesTitle),
      '',
      ...(listed.length === 0
        ? ['- (no dynamic sites)']
        : [
            ...listed.map((site) => formatKitsDynamicSampleTerminal(site)),
            ...(focused.length > listed.length
              ? [
                  formatKitsListOmittedTerminal(
                    `  · ${String(listed.length)} dynamic site(s) shown`,
                    focused.length - listed.length,
                  ),
                ]
              : []),
          ]),
    ].join('\n');

    const data = {
      kind: 'kits-pr' as const,
      summary,
      groups,
      focusedCount: focused.length,
      listedCount: listed.length,
      listMode: listModeLabel(listWindow.full, listWindow.top),
      sites: listed,
      issues: [...v.issues, ...d.issues, ...q.issues],
    };

    if (opts.saveBaseline) {
      const saveContent = context.run.json
        ? emitKitsJsonResult('kits-pr', data, context, { issues: data.issues })
        : formatKitsHumanText(markdown);
      const saved = saveKitsBaselineReport(projectRoot, opts.saveBaseline, saveContent, context.run.json);
      logKitsSavedBaseline(saved, context);
    }

    finishKitsRun('kits-pr', context, {
      data,
      outPath: opts.out,
      issues: data.issues,
      markdownText: markdown,
      terminalText: terminal,
      summaryCounts: {
        missing: summary.missingLiteralKeys,
        dynamic: summary.dynamic,
        sourceIdentical: summary.sourceIdentical,
      },
    });
  } catch (err) {
    if (!ctx) throw err;
    emitKitsFailure('kits-pr', EMPTY_PR, ctx.ctx, err);
  }
}
