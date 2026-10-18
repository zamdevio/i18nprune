import fs from 'node:fs';
import path from 'node:path';
import type { ReleaseSections, StreamId } from '../../src/types/index.js';
import { CHANGELOG_PATH, type LoadedRelease } from './utils.js';

const STREAM_LABEL: Record<StreamId, string> = {
  cli: 'CLI',
  core: 'Core',
  extension: 'Extension',
};

const SECTION_ORDER: (keyof ReleaseSections)[] = [
  'breaking',
  'security',
  'added',
  'changed',
  'fixed',
  'removed',
  'performance',
];

const SECTION_LABEL: Record<keyof ReleaseSections, string> = {
  breaking: 'Breaking',
  security: 'Security',
  added: 'Added',
  changed: 'Changed',
  fixed: 'Fixed',
  removed: 'Removed',
  performance: 'Performance',
};

const HEADER = `<!-- AUTO-GENERATED — do not edit. Source: apps/releases/content/**/*.yaml · regenerate with \`pnpm releases:generate\`. -->

# Changelog

Release notes for the **i18nprune CLI** and **\`@i18nprune/core\`**. Each entry links to its
full notes on the [releases portal](https://releases.i18nprune.dev). This file is generated
from \`apps/releases/content/\` — edit the YAML, never this file.
`;

/** Newest first; ties broken by stream then version so output is deterministic. */
function sortEntries(entries: LoadedRelease[]): LoadedRelease[] {
  return [...entries].sort((a, b) => {
    const byDate = new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
    if (byDate !== 0) return byDate;
    if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);
    return b.version.localeCompare(a.version);
  });
}

function renderEntry(entry: LoadedRelease, origin: string): string {
  const { stream, version, data } = entry;
  const url = `${origin}/${stream}/${version}`;
  const lines: string[] = [
    `## ${STREAM_LABEL[stream]} v${version} — ${data.date}`,
    '',
    data.summary,
    '',
    `[Full release notes →](${url})`,
  ];

  for (const key of SECTION_ORDER) {
    const items = data.sections?.[key] ?? [];
    if (items.length === 0) continue;
    lines.push('', `**${SECTION_LABEL[key]}**`);
    for (const item of items) lines.push(`- ${item}`);
  }

  return `${lines.join('\n')}\n`;
}

export function renderChangelog(entries: LoadedRelease[], origin: string): string {
  const body = sortEntries(entries)
    .map((entry) => renderEntry(entry, origin))
    .join('\n---\n\n');
  return `${HEADER}\n---\n\n${body}`;
}

/** Write the generated changelog to the monorepo root (tracked, committed). */
export function writeChangelog(entries: LoadedRelease[], origin: string): void {
  fs.mkdirSync(path.dirname(CHANGELOG_PATH), { recursive: true });
  fs.writeFileSync(CHANGELOG_PATH, renderChangelog(entries, origin));
}
