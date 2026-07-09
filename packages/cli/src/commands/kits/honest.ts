import { runDynamic, runQuality, runReview, runValidate } from '@i18nprune/core';
import { resolveKitsBundle } from '@/commands/kits/lib/context.js';
import {
  emitKitsFailure,
  emitKitsJsonResult,
  finishKitsRun,
  formatKitsHumanText,
  logKitsSavedBaseline,
} from '@/commands/kits/lib/emit.js';
import { evaluateKitsPolicy, parseFailOnList } from '@/commands/kits/lib/policy.js';
import { resolveKitsListWindow, listModeLabel } from '@/commands/kits/lib/list.js';
import { loadKitsBaselineSignal, saveKitsBaselineReport } from '@/commands/kits/lib/baseline.js';
import type { KitsHonestOptions } from '@/types/command/kits/index.js';

const EMPTY_HONEST = {
  kind: 'kits-honest' as const,
  signal: {
    missingLiteralKeys: 0,
    dynamicKeySites: 0,
    sourceIdenticalLeaves: 0,
  },
  dynamicGroups: {},
  sourceIdenticalByFile: {},
  localeSources: {},
  metadataGaps: {},
  focusedDynamicSites: [],
  focusedDynamicCount: 0,
  listMode: 'top 3',
  issues: [],
};

export async function kitsHonest(opts: KitsHonestOptions): Promise<void> {
  let ctx: Awaited<ReturnType<typeof resolveKitsBundle>> | undefined;
  try {
    const bundle = await resolveKitsBundle();
    ctx = bundle;
    const { ctx: context, coreCtx, projectRoot } = bundle;
    const listWindow = resolveKitsListWindow(context.config);

    const v = runValidate(coreCtx, {}, {});
    const d = runDynamic(coreCtx, { full: true, top: 5000 }, {});
    const q = runQuality(coreCtx, { target: opts.target }, {});
    const r = runReview(coreCtx, { target: opts.target }, {});

    const vp = v.payload as {
      summary?: {
        missing?: unknown[];
        dynamic?: { count?: number; active?: number; commented?: number };
        keyObservations?: { count?: number };
      };
    };
    const dp = d.payload as {
      dynamic?: {
        groups?: Record<string, number>;
        sites?: Array<{ filePath?: string; line?: number; kind?: string; preview?: string }>;
        active?: number;
        commented?: number;
      };
    };
    const qp = q.payload as { total?: number; perFile?: Record<string, number> };
    const rp = r.payload as {
      locales?: Record<string, { bySource?: Record<string, number>; structuredLeavesMissingConfidence?: number }>;
    };

    const dynamicSites = dp.dynamic?.sites ?? [];
    const focusedSites = opts.focus
      ? dynamicSites.filter((s) =>
          `${s.filePath ?? ''} ${s.preview ?? ''}`.toLowerCase().includes(opts.focus!.toLowerCase()),
        )
      : dynamicSites;
    const listedSites = listWindow.full ? focusedSites : focusedSites.slice(0, listWindow.top);

    const result = {
      kind: 'kits-honest' as const,
      signal: {
        missingLiteralKeys: vp.summary?.missing?.length ?? 0,
        dynamicKeySites: dynamicSites.length,
        dynamicActive: dp.dynamic?.active,
        dynamicCommented: dp.dynamic?.commented,
        keyObservations: vp.summary?.keyObservations?.count,
        sourceIdenticalLeaves: qp.total ?? 0,
      },
      dynamicGroups: dp.dynamic?.groups ?? {},
      sourceIdenticalByFile: qp.perFile ?? {},
      localeSources: Object.fromEntries(
        Object.entries(rp.locales ?? {}).map(([file, row]) => [file, row.bySource ?? {}]),
      ),
      metadataGaps: Object.fromEntries(
        Object.entries(rp.locales ?? {}).map(([file, row]) => [
          file,
          row.structuredLeavesMissingConfidence ?? 0,
        ]),
      ),
      focusedDynamicSites: listedSites,
      focusedDynamicCount: focusedSites.length,
      listMode: listModeLabel(listWindow.full, listWindow.top),
      issues: [...v.issues, ...d.issues, ...q.issues, ...r.issues],
    };

    let baselineDelta:
      | { missingLiteralKeys: number; dynamicKeySites: number; sourceIdenticalLeaves: number }
      | undefined;
    if (opts.baseline) {
      const b = loadKitsBaselineSignal(projectRoot, opts.baseline);
      baselineDelta = {
        missingLiteralKeys: result.signal.missingLiteralKeys - (b.missingLiteralKeys ?? 0),
        dynamicKeySites: result.signal.dynamicKeySites - (b.dynamicKeySites ?? 0),
        sourceIdenticalLeaves: result.signal.sourceIdenticalLeaves - (b.sourceIdenticalLeaves ?? 0),
      };
    }

    const failOn = opts.strict
      ? [...parseFailOnList(opts.failOn), 'missing', 'source-identical']
      : parseFailOnList(opts.failOn);
    const policyReasons = evaluateKitsPolicy(
      {
        missingLiteralKeys: result.signal.missingLiteralKeys,
        dynamicKeySites: result.signal.dynamicKeySites,
        sourceIdenticalLeaves: result.signal.sourceIdenticalLeaves,
        issuesCount: result.issues.length,
      },
      failOn,
      opts.maxDynamic,
    );

    const data = {
      ...result,
      baselineDelta,
      policy: { failOn, maxDynamic: opts.maxDynamic, reasons: policyReasons },
    };

    const mdLines = [
      '## i18nprune Honest Audit',
      '',
      `- Missing literal keys: **${result.signal.missingLiteralKeys}**`,
      `- Dynamic key sites: **${result.signal.dynamicKeySites}** (active=${result.signal.dynamicActive ?? '?'}, commented=${result.signal.dynamicCommented ?? '?'})`,
      `- Source-identical leaves: **${result.signal.sourceIdenticalLeaves}**`,
      '',
      `- Dynamic groups: \`${JSON.stringify(result.dynamicGroups)}\``,
      `- Listed: **${result.focusedDynamicSites.length}/${result.focusedDynamicCount}** (${result.listMode})`,
      '',
      '> Dynamic sites are not literal coverage — validate ok does not prove every dynamic suffix has locale strings.',
    ];
    if (opts.focus) mdLines.push(`- Focus: \`${opts.focus}\``);
    mdLines.push(
      '',
      '### Dynamic samples',
      ...result.focusedDynamicSites.map((s) => `- [${s.kind}] \`${s.filePath}:${s.line}\` — \`${s.preview}\``),
    );
    if (baselineDelta) {
      mdLines.push(
        '',
        '### Baseline delta',
        '',
        `- missingLiteralKeys: \`${baselineDelta.missingLiteralKeys}\``,
        `- dynamicKeySites: \`${baselineDelta.dynamicKeySites}\``,
        `- sourceIdenticalLeaves: \`${baselineDelta.sourceIdenticalLeaves}\``,
      );
    }
    if (policyReasons.length > 0) {
      mdLines.push('', `> **Policy failure:** ${policyReasons.join('; ')}`);
    }
    const humanText = mdLines.join('\n');

    if (opts.saveBaseline) {
      const saveContent = context.run.json
        ? emitKitsJsonResult('kits-honest', data, context, { issues: data.issues })
        : formatKitsHumanText(humanText);
      const saved = saveKitsBaselineReport(projectRoot, opts.saveBaseline, saveContent, context.run.json);
      logKitsSavedBaseline(saved, context);
    }

    finishKitsRun('kits-honest', context, {
      data,
      outPath: opts.out,
      issues: data.issues,
      humanText,
      summaryCounts: {
        missing: result.signal.missingLiteralKeys,
        dynamic: result.signal.dynamicKeySites,
        sourceIdentical: result.signal.sourceIdenticalLeaves,
      },
      policyFailed: policyReasons.length > 0,
    });
  } catch (err) {
    if (!ctx) throw err;
    emitKitsFailure('kits-honest', EMPTY_HONEST, ctx.ctx, err);
  }
}
