import { runQuality, runValidate } from '@i18nprune/core';
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
  formatKitsHeadingMd,
  formatKitsHeadingTerminal,
  formatKitsMetricMd,
  formatKitsMetricTerminal,
} from '@/commands/kits/lib/humanFormat.js';
import { loadKitsBaselineSignal, saveKitsBaselineReport } from '@/commands/kits/lib/baseline.js';
import type { KitsSharedOptions } from '@/types/command/kits/index.js';

const EMPTY_BASELINE = {
  kind: 'kits-baseline' as const,
  signal: {
    missingLiteralKeys: 0,
    dynamicKeySites: 0,
    sourceIdenticalLeaves: 0,
  },
  delta: undefined as Record<string, number> | undefined,
  baselinePath: undefined as string | undefined,
};

export async function kitsBaseline(opts: KitsSharedOptions): Promise<void> {
  let ctx: Awaited<ReturnType<typeof resolveKitsBundle>> | undefined;
  try {
    const bundle = await resolveKitsBundle();
    ctx = bundle;
    const { ctx: context, coreCtx, projectRoot } = bundle;
    const v = runValidate(coreCtx, {}, {});
    const q = runQuality(coreCtx, { target: opts.target }, {});

    const vp = v.payload as { summary?: { missing?: unknown[]; dynamic?: { count?: number } } };
    const signal = {
      missingLiteralKeys: vp.summary?.missing?.length ?? 0,
      dynamicKeySites: vp.summary?.dynamic?.count ?? 0,
      sourceIdenticalLeaves: (q.payload as { total?: number }).total ?? 0,
    };

    let delta: Record<string, number> | undefined;
    if (opts.baseline) {
      const b = loadKitsBaselineSignal(projectRoot, opts.baseline);
      delta = {
        missingLiteralKeys: signal.missingLiteralKeys - (b.missingLiteralKeys ?? 0),
        dynamicKeySites: signal.dynamicKeySites - (b.dynamicKeySites ?? 0),
        sourceIdenticalLeaves: signal.sourceIdenticalLeaves - (b.sourceIdenticalLeaves ?? 0),
      };
    }

    const markdown = [
      formatKitsHeadingMd(2, 'i18nprune Baseline'),
      '',
      formatKitsMetricMd('Missing literal keys', signal.missingLiteralKeys),
      formatKitsMetricMd('Dynamic key sites', signal.dynamicKeySites),
      formatKitsMetricMd('Source-identical leaves', signal.sourceIdenticalLeaves),
      '',
      formatKitsBlockquoteMd(
        'Dynamic count reflects non-literal call sites — not proof of complete translations under dynamic prefixes.',
      ),
      ...(delta
        ? [
            '',
            formatKitsHeadingMd(3, 'Delta vs baseline'),
            '',
            formatKitsMetricMd('missingLiteralKeys Δ', delta.missingLiteralKeys),
            formatKitsMetricMd('dynamicKeySites Δ', delta.dynamicKeySites),
            formatKitsMetricMd('sourceIdenticalLeaves Δ', delta.sourceIdenticalLeaves),
          ]
        : []),
    ].join('\n');

    const terminal = [
      formatKitsHeadingTerminal('i18nprune Baseline'),
      '',
      formatKitsMetricTerminal('Missing literal keys', signal.missingLiteralKeys),
      formatKitsMetricTerminal('Dynamic key sites', signal.dynamicKeySites),
      formatKitsMetricTerminal('Source-identical leaves', signal.sourceIdenticalLeaves),
      '',
      formatKitsBlockquoteTerminal(
        'Dynamic count reflects non-literal call sites — not proof of complete translations under dynamic prefixes.',
      ),
      ...(delta
        ? [
            '',
            formatKitsHeadingTerminal('Delta vs baseline'),
            '',
            formatKitsMetricTerminal('missingLiteralKeys Δ', delta.missingLiteralKeys),
            formatKitsMetricTerminal('dynamicKeySites Δ', delta.dynamicKeySites),
            formatKitsMetricTerminal('sourceIdenticalLeaves Δ', delta.sourceIdenticalLeaves),
          ]
        : []),
    ].join('\n');

    const data = {
      kind: 'kits-baseline' as const,
      signal,
      delta,
      baselinePath: opts.baseline,
      issues: [...v.issues, ...q.issues],
    };

    if (opts.saveBaseline) {
      const saveContent = context.run.json
        ? emitKitsJsonResult('kits-baseline', data, context, { issues: data.issues })
        : formatKitsHumanText(markdown);
      const saved = saveKitsBaselineReport(projectRoot, opts.saveBaseline, saveContent, context.run.json);
      logKitsSavedBaseline(saved, context);
    }

    finishKitsRun('kits-baseline', context, {
      data,
      outPath: opts.out,
      issues: data.issues,
      markdownText: markdown,
      terminalText: terminal,
      summaryCounts: {
        missing: signal.missingLiteralKeys,
        dynamic: signal.dynamicKeySites,
        sourceIdentical: signal.sourceIdenticalLeaves,
      },
    });
  } catch (err) {
    if (!ctx) throw err;
    emitKitsFailure('kits-baseline', { ...EMPTY_BASELINE, baselinePath: opts.baseline }, ctx.ctx, err);
  }
}
