import { formatListShownOmitted } from '@i18nprune/core';
import { style } from '@/utils/style/index.js';

export type KitsDynamicSiteRow = {
  kind?: string;
  filePath?: string;
  line?: number;
  preview?: string;
};

const GROUP_LABELS: Record<string, string> = {
  mixedConstRuntime: 'mixed_const_runtime',
  templateInterpolation: 'template_interpolation',
  nonLiteral: 'non_literal',
  emptyCall: 'empty_call',
  commented: 'commented',
};

export function formatKitsMetricMd(label: string, value: number | string): string {
  return `- ${label}: **${String(value)}**`;
}

export function formatKitsHeadingMd(level: 2 | 3, title: string): string {
  return `${'#'.repeat(level)} ${title}`;
}

export function formatKitsBlockquoteMd(text: string): string {
  return `> ${text}`;
}

export function formatKitsBlockquoteTerminal(text: string): string {
  return style.dim(`> ${text}`);
}

export function formatKitsDynamicGroupsMd(groups: Record<string, number>): string {
  const parts = Object.entries(groups)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => `\`${GROUP_LABELS[key] ?? key}\` **${String(count)}**`);
  if (parts.length === 0) return '- Dynamic groups: _(none)_';
  return `- Dynamic groups: ${parts.join(' · ')}`;
}

export function formatKitsDynamicSampleMd(site: KitsDynamicSiteRow): string {
  return `- [${site.kind ?? 'unknown'}] \`${site.filePath ?? '?'}:${String(site.line ?? '?')}\` — \`${site.preview ?? ''}\``;
}

export function formatKitsDynamicSamplesSectionMd(input: {
  title: string;
  sites: readonly KitsDynamicSiteRow[];
  shownCount: number;
  totalCount: number;
}): string[] {
  const lines = [formatKitsHeadingMd(3, input.title), ''];
  if (input.sites.length === 0) {
    lines.push('- _(no dynamic sites)_');
    return lines;
  }
  lines.push(...input.sites.map((site) => formatKitsDynamicSampleMd(site)));
  const omitted = input.totalCount - input.shownCount;
  if (omitted > 0) {
    lines.push(
      formatListShownOmitted(`  · ${String(input.shownCount)} dynamic site(s) shown`, omitted),
    );
  }
  return lines;
}

export function formatKitsDynamicGroupsTerminal(groups: Record<string, number>): string {
  const parts = Object.entries(groups)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => `${GROUP_LABELS[key] ?? key}=${String(count)}`);
  if (parts.length === 0) return style.dim('  · groups: (none)');
  return style.dim(`  · groups: ${parts.join(' · ')}`);
}

export function formatKitsMetricTerminal(label: string, value: number | string): string {
  return `- ${label}: ${style.bold(String(value))}`;
}

export function formatKitsHeadingTerminal(title: string): string {
  return style.bold(title);
}

export function formatKitsDynamicSampleTerminal(site: KitsDynamicSiteRow): string {
  const kind = site.kind ?? 'unknown';
  const loc = site.filePath !== undefined && site.line !== undefined ? `${site.filePath}:${String(site.line)}` : '?';
  const preview = site.preview ?? '';
  return `- [${kind}]${style.dim(` \`${loc}\` — \`${preview}\``)}`;
}

export function formatKitsIdenticalRowTerminal(path: string, value: string): string {
  return `- ${path}${style.dim(` = ${JSON.stringify(value)}`)}`;
}

export function formatKitsListOmittedTerminal(prefix: string, omitted: number): string {
  return style.dim(formatListShownOmitted(prefix, omitted));
}
