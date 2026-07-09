import { runQuality, runValidate } from '@i18nprune/core';
import { resolveKitsBundle } from '@/commands/kits/lib/context.js';
import {
  emitKitsFailure,
  emitKitsJsonResult,
  finishKitsRun,
  formatKitsHumanText,
  logKitsSavedBaseline,
} from '@/commands/kits/lib/emit.js';
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

    const md = [
      '## i18nprune Baseline',
      '',
      `- Missing literal keys: **${signal.missingLiteralKeys}**`,
      `- Dynamic key sites: **${signal.dynamicKeySites}**`,
      `- Source-identical leaves: **${signal.sourceIdenticalLeaves}**`,
      '',
      '> Dynamic count reflects non-literal call sites — not proof of complete translations under dynamic prefixes.',
      ...(delta
        ? [
            '',
            '### Delta vs baseline',
            '',
            `- missingLiteralKeys: \`${delta.missingLiteralKeys}\``,
            `- dynamicKeySites: \`${delta.dynamicKeySites}\``,
            `- sourceIdenticalLeaves: \`${delta.sourceIdenticalLeaves}\``,
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

    let saveContent: string | undefined;
    if (opts.saveBaseline) {
      saveContent = context.run.json
        ? emitKitsJsonResult('kits-baseline', data, context, { issues: data.issues })
        : formatKitsHumanText(md);
      const saved = saveKitsBaselineReport(projectRoot, opts.saveBaseline, saveContent, context.run.json);
      logKitsSavedBaseline(saved, context);
    }

    finishKitsRun('kits-baseline', context, {
      data,
      outPath: opts.out,
      issues: data.issues,
      humanText: md,
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
