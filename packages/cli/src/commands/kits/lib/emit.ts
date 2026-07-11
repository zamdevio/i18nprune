import fs from 'node:fs';
import process from 'node:process';
import {
  buildCliJsonEnvelope,
  getRunOptions,
  stringifyEnvelope,
  type Issue,
} from '@i18nprune/core';
import { cliEnvelopeCwd } from '@/shared/result/envelopeCwd.js';
import {
  buildIoReadFailureEnvelope,
  issuesFromDiscoveryWarnings,
  mergeIssues,
} from '@/shared/result/index.js';
import { printCommandSummary } from '@/output/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintPrimary } from '@/utils/logger/policy.js';
import type { Context } from '@/types/core/context/index.js';
import type { KitsCommandId } from '@/constants/commandInvocation.js';
import { kitsCommandLabel } from '@/constants/commandInvocation.js';
import { formatKitsTerminalMarkdown } from '@/commands/kits/lib/terminalMarkdown.js';

function ensureTrailingNewline(text: string): string {
  return text.endsWith('\n') ? text : `${text}\n`;
}

export function writeKitsOutput(text: string, outPath: string | undefined, run = getRunOptions()): void {
  const trimmed = text.trimEnd();
  if (outPath) {
    fs.writeFileSync(outPath, `${trimmed}\n`, 'utf8');
    return;
  }
  if (run.json) {
    console.log(trimmed);
    return;
  }
  logger.plain(formatKitsTerminalMarkdown(trimmed, run), run);
}

export function emitKitsJsonResult<K extends KitsCommandId, D>(
  commandId: K,
  data: D,
  ctx: Context,
  options: {
    outPath?: string;
    issues?: Issue[];
    ok?: boolean;
  },
): string {
  const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), options.issues ?? []);
  const ok = options.ok !== false && !issues.some((issue) => issue.severity === 'error');
  const envelope = buildCliJsonEnvelope(commandId, data, {
    ok,
    issues,
    cwd: cliEnvelopeCwd(ctx),
  });
  return stringifyEnvelope(envelope);
}

export function finishKitsRun<K extends KitsCommandId, D>(
  commandId: K,
  ctx: Context,
  options: {
    data: D;
    outPath?: string;
    issues?: Issue[];
    ok?: boolean;
    /** Markdown for `--out` / `-sb` file saves. */
    markdownText?: string;
    /** Pre-styled terminal body; defaults to {@link formatKitsTerminalMarkdown} on `markdownText`. */
    terminalText?: string;
    summaryCounts?: Record<string, number>;
    policyFailed?: boolean;
  },
): void {
  const markdown = options.markdownText;
  if (ctx.run.json) {
    const text = emitKitsJsonResult(commandId, options.data, ctx, {
      outPath: options.outPath,
      issues: options.issues,
      ok: options.ok,
    });
    writeKitsOutput(text, options.outPath, ctx.run);
  } else if (markdown !== undefined && canPrintPrimary(ctx.run)) {
    if (options.outPath) {
      fs.writeFileSync(options.outPath, ensureTrailingNewline(markdown), 'utf8');
    } else {
      const terminal = options.terminalText ?? formatKitsTerminalMarkdown(markdown, ctx.run);
      logger.plain(ensureTrailingNewline(terminal), ctx.run);
    }
  } else if (options.outPath && markdown !== undefined) {
    fs.writeFileSync(options.outPath, ensureTrailingNewline(markdown), 'utf8');
  }

  if (!ctx.run.json && options.summaryCounts && Object.keys(options.summaryCounts).length > 0) {
    printCommandSummary(
      {
        command: kitsCommandLabel(commandId),
        ok: options.ok !== false && !options.policyFailed,
        counts: options.summaryCounts,
        issues: options.issues,
      },
      ctx,
    );
  }

  if (options.policyFailed) {
    process.exitCode = 2;
  }
}

export function logKitsSavedBaseline(savedPath: string, ctx: Context): void {
  logger.detail(`saved-baseline: ${savedPath}`, ctx.run);
}

export function emitKitsFailure<K extends KitsCommandId, D>(
  commandId: K,
  emptyData: D,
  ctx: Context,
  err: unknown,
): void {
  if (!ctx.run.json) throw err;
  const envelope = buildIoReadFailureEnvelope(commandId, emptyData, ctx, err);
  console.log(stringifyEnvelope(envelope));
  process.exitCode = 1;
}

export function formatKitsHumanText(text: string): string {
  return ensureTrailingNewline(text);
}
