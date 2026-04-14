import type { ProjectReportDocument, ReportCommandFormat } from '@/types/command/report/index.js';
import { renderProjectReportSpaHtml } from '@/commands/report/htmlTemplate.js';

export function formatProjectReportDocument(
  format: ReportCommandFormat,
  doc: ProjectReportDocument,
): string {
  switch (format) {
    case 'json':
      return `${JSON.stringify(doc, null, 2)}\n`;
    case 'csv':
      return formatCsv(doc);
    case 'text':
      return formatText(doc);
    case 'html':
      return renderProjectReportSpaHtml(doc);
    default: {
      const _x: never = format;
      return _x;
    }
  }
}

function formatText(doc: ProjectReportDocument): string {
  const { summary, project } = doc;
  const lines: string[] = [
    `i18nprune project report · ${doc.toolVersion}`,
    `generatedAt: ${doc.generatedAt}`,
    `source: ${project.sourceLocalePath}`,
    `locales: ${project.localesDir}`,
    `scan root: ${project.srcRoot}`,
    '',
    `missing keys: ${String(summary.missingKeysCount)} (${summary.ok ? 'ok' : 'needs attention'})`,
    `dynamic sites: ${String(summary.dynamicSitesCount)}`,
    `key observations: ${String(summary.keyObservationsCount)}`,
    ...(summary.sourceFilesScannedCount !== undefined
      ? [`source files scanned (src root): ${String(summary.sourceFilesScannedCount)}`]
      : []),
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function formatCsv(doc: ProjectReportDocument): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows: string[] = ['section,index,key,value,json'];
  const pushRow = (
    section: string,
    index: number | '',
    key: string,
    value: string,
    json: string,
  ): void => {
    rows.push([esc(section), String(index), esc(key), esc(value), esc(json)].join(','));
  };

  pushRow('meta', '', 'kind', doc.kind, JSON.stringify(doc));
  pushRow('meta', '', 'schemaVersion', String(doc.schemaVersion), JSON.stringify(doc));
  pushRow('meta', '', 'generatedAt', doc.generatedAt, JSON.stringify(doc));
  pushRow('meta', '', 'toolVersion', doc.toolVersion, JSON.stringify(doc));

  for (const [k, v] of Object.entries(doc.project)) {
    pushRow('project', '', k, String(v ?? ''), JSON.stringify(doc.project));
  }
  for (const [k, v] of Object.entries(doc.summary)) {
    pushRow('summary', '', k, String(v), JSON.stringify(doc.summary));
  }

  doc.details.missingKeys.forEach((key, i) => {
    pushRow('missingKeys', i, 'key', key, JSON.stringify({ key }));
  });
  doc.details.dynamicSites.forEach((site, i) => {
    pushRow('dynamicSites', i, 'site', '', JSON.stringify(site));
  });
  doc.details.keyObservations.forEach((observation, i) => {
    pushRow('keyObservations', i, 'observation', '', JSON.stringify(observation));
  });

  return `${rows.join('\n')}\n`;
}
