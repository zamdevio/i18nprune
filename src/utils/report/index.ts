import fs from 'node:fs';
import path from 'node:path';
import { getReportFilePath, getReportFormatOverride } from '@/core/context/report.js';
import type { I18nPruneConfig } from '@/types/config/index.js';
import { getReportEntries, resetReportSession } from '@/utils/report/session.js';
import type { ReportEntry, ReportFormat, ReportRunMeta } from '@/utils/report/types.js';
import { formatSectionTitle } from '@/utils/style/section.js';
import { style } from '@/utils/style/index.js';

export type { ReportEntry, ReportFormat, ReportRunMeta } from '@/utils/report/types.js';
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

/**
 * Writes **`--report-file`** when set. Formats are self-contained (no **`logger`**); styles apply to **text** only.
 */
export function finalizeReportFile(
  config: I18nPruneConfig | undefined,
  meta: ReportRunMeta,
): void {
  const target = getReportFilePath();
  if (!target) return;
  const format = resolveFormat(config);
  const entries = getReportEntries();
  let body: string;
  if (format === 'text') body = formatText(entries, meta);
  else if (format === 'csv') body = formatCsv(entries, meta);
  else body = formatJson(entries, meta);
  const dir = path.dirname(target);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(target, body, 'utf8');
  resetReportSession();
}
