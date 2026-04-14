import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { select } from '@inquirer/prompts';
import { getReportFilePath, getReportFormatOverride } from '@/core/context/report.js';
import { getCliYesFlag } from '@/core/context/globals.js';
import { getRunOptions } from '@/core/runtime/options.js';
import type { I18nPruneConfig } from '@/types/config/index.js';
import { shouldSkipInteractivePrompts } from '@/utils/interactive/index.js';
import { getReportEntries, resetReportSession } from '@/utils/report/session.js';
import type { ReportEntry, ReportFormat, ReportRunMeta } from '@/types/utils/report/index.js';
import { formatSectionTitle } from '@/utils/style/section.js';
import { style } from '@/utils/style/index.js';

export type { ReportEntry, ReportFormat, ReportRunMeta } from '@/types/utils/report/index.js';
export { pushReportEntry, resetReportSession, getReportEntries } from '@/utils/report/session.js';

function resolveFormat(config: I18nPruneConfig | undefined): ReportFormat {
  const fromCli = getReportFormatOverride();
  if (fromCli) return fromCli;
  const fromCfg = config?.reportFormat;
  if (fromCfg === 'json' || fromCfg === 'text' || fromCfg === 'csv') return fromCfg;
  return 'json';
}

function formatText(entries: ReportEntry[], meta: ReportRunMeta): string {
  const lines: string[] = [];
  lines.push(formatSectionTitle(`i18nprune report · ${meta.command}`));
  if (meta.durationMs !== undefined) lines.push(`${style.accent('durationMs')}: ${String(meta.durationMs)}`);
  if (meta.counts && Object.keys(meta.counts).length > 0) {
    for (const [k, v] of Object.entries(meta.counts)) {
      lines.push(`${style.accent(k)}: ${String(v)}`);
    }
  }
  lines.push('');
  for (const e of entries) {
    const tag =
      e.level === 'warn' ? style.warn(`[${e.level}]`) : e.level === 'error' ? style.err(`[${e.level}]`) : style.ok(`[${e.level}]`);
    lines.push(`${tag} ${e.message}`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function formatJson(entries: ReportEntry[], meta: ReportRunMeta): string {
  return `${JSON.stringify({ kind: 'i18nprune.report', ...meta, entries }, null, 2)}\n`;
}

function formatCsv(entries: ReportEntry[], meta: ReportRunMeta): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows: string[] = ['command,durationMs,level,message,data'];
  const dur = meta.durationMs ?? '';
  for (const e of entries) {
    const data = e.data ? esc(JSON.stringify(e.data)) : '';
    rows.push([esc(meta.command), String(dur), e.level, esc(e.message), data].join(','));
  }
  return `${rows.join('\n')}\n`;
}

function keepBothPath(target: string): string {
  const dir = path.dirname(target);
  const ext = path.extname(target);
  const stem = path.basename(target, ext);
  let candidate = path.join(dir, `${stem}-${randomBytes(4).toString('hex')}${ext}`);
  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${stem}-${randomBytes(4).toString('hex')}${ext}`);
  }
  return candidate;
}

export async function resolveReportOutputPath(target: string): Promise<string | null> {
  if (!fs.existsSync(target)) return target;
  /** Non-interactive / automation: never prompt (TTY or not). `--json` must not block on overwrite. */
  if (getCliYesFlag() || shouldSkipInteractivePrompts() || getRunOptions().json) {
    return keepBothPath(target);
  }
  const action = await select({
    message: `Report file exists: ${target}`,
    choices: [
      { name: 'Overwrite existing file', value: 'overwrite' },
      { name: 'Keep both (write new file with random 8-char hex suffix)', value: 'keep-both' },
      { name: 'Skip report file writing', value: 'skip' },
    ],
    default: 'keep-both',
  });
  if (action === 'skip') return null;
  if (action === 'keep-both') return keepBothPath(target);
  return target;
}

/**
 * Writes **`--report-file`** when set. Formats are self-contained (no **`logger`**); styles apply to **text** only.
 */
export async function finalizeReportFile(
  config: I18nPruneConfig | undefined,
  meta: ReportRunMeta,
): Promise<void> {
  try {
    const target = getReportFilePath();
    if (!target) return;
    const resolvedTarget = await resolveReportOutputPath(target);
    if (!resolvedTarget) {
      resetReportSession();
      return;
    }
    const format = resolveFormat(config);
    const entries = getReportEntries();
    let body: string;
    if (format === 'text') body = formatText(entries, meta);
    else if (format === 'csv') body = formatCsv(entries, meta);
    else body = formatJson(entries, meta);
    const dir = path.dirname(resolvedTarget);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(resolvedTarget, body, 'utf8');
    resetReportSession();
  } catch {
    resetReportSession();
  }
}
