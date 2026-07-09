import { runDynamic } from '@i18nprune/core';
import { style } from '@/utils/style/index.js';
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
import { dynamicKeyHonestyLines } from '@/commands/kits/lib/messaging.js';
import { saveKitsBaselineReport } from '@/commands/kits/lib/baseline.js';
import type { KitsDynamicOptions } from '@/types/command/kits/index.js';

type DynamicSite = {
  kind?: string;
  filePath?: string;
  line?: number;
  preview?: string;
};

const EMPTY_DYNAMIC = {
  kind: 'kits-dynamic' as const,
  counts: { total: 0, active: 0, commented: 0 },
  groups: {},
  filteredCount: 0,
  listedCount: 0,
  listMode: 'top 3',
  sites: [] as DynamicSite[],
  issues: [],
};

export async function kitsDynamic(opts: KitsDynamicOptions): Promise<void> {
  let ctx: Awaited<ReturnType<typeof resolveKitsBundle>> | undefined;
  try {
    const bundle = await resolveKitsBundle();
    ctx = bundle;
    const { ctx: context, coreCtx, projectRoot } = bundle;
    const listWindow = resolveKitsListWindow(context.config);
    const out = runDynamic(coreCtx, listWindow, {});
    const payload = out.payload as {
      dynamic?: {
        count?: number;
        active?: number;
        commented?: number;
        groups?: Record<string, number>;
        sites?: DynamicSite[];
      };
    };

    const sites = payload.dynamic?.sites ?? [];
    const filtered = opts.contains
      ? sites.filter((s) =>
          `${s.filePath ?? ''} ${s.preview ?? ''}`.toLowerCase().includes(opts.contains!.toLowerCase()),
        )
      : sites;

    const listedSites = listWindow.full ? filtered : filtered.slice(0, listWindow.top);
    const data = {
      kind: 'kits-dynamic' as const,
      counts: {
        total: payload.dynamic?.count ?? filtered.length,
        active: payload.dynamic?.active,
        commented: payload.dynamic?.commented,
      },
      groups: payload.dynamic?.groups ?? {},
      filteredCount: filtered.length,
      listedCount: listedSites.length,
      listMode: listModeLabel(listWindow.full, listWindow.top),
      sites: listedSites,
      issues: out.issues,
    };

    const failOn = parseFailOnList(opts.failOn);
    const policyReasons = evaluateKitsPolicy(
      { dynamicKeySites: data.counts.total, issuesCount: data.issues.length },
      failOn,
      opts.maxDynamic,
    );
    const payloadWithPolicy = {
      ...data,
      policy: { failOn, maxDynamic: opts.maxDynamic, reasons: policyReasons },
    };

    const lines: string[] = [
      `${style.magenta(style.bold('Dynamic sites'))}: ${data.counts.total} (active: ${data.counts.active ?? '?'}, commented: ${data.counts.commented ?? '?'})`,
      `${style.accent(style.bold('Filtered'))}: ${data.filteredCount}`,
      `${style.accent(style.bold('Listed'))}: ${data.listedCount} (${data.listMode})`,
    ];
    if (Object.keys(data.groups).length > 0) {
      lines.push(`${style.accent(style.bold('Groups'))}: ${JSON.stringify(data.groups)}`);
    }
    for (const site of data.sites) {
      lines.push(`- [${site.kind}] ${site.filePath}:${site.line} :: ${site.preview}`);
    }
    if (policyReasons.length > 0) {
      lines.push(`${style.err(style.bold('Policy failure'))}: ${policyReasons.join('; ')}`);
    }
    lines.push(...dynamicKeyHonestyLines());
    const humanText = lines.join('\n');

    if (opts.saveBaseline) {
      const saveContent = context.run.json
        ? emitKitsJsonResult('kits-dynamic', payloadWithPolicy, context, { issues: data.issues })
        : formatKitsHumanText(humanText);
      const saved = saveKitsBaselineReport(projectRoot, opts.saveBaseline, saveContent, context.run.json);
      logKitsSavedBaseline(saved, context);
    }

    finishKitsRun('kits-dynamic', context, {
      data: payloadWithPolicy,
      outPath: opts.out,
      issues: data.issues,
      humanText,
      summaryCounts: {
        dynamic: data.counts.total ?? 0,
        listed: data.listedCount,
      },
      policyFailed: policyReasons.length > 0,
    });
  } catch (err) {
    if (!ctx) throw err;
    emitKitsFailure('kits-dynamic', EMPTY_DYNAMIC, ctx.ctx, err);
  }
}
