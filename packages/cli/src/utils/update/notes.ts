import { CLI_VERSION } from '@/constants/cli.js';
import { SDK_VERSION } from '@i18nprune/core';
import type { RunOptions } from '@i18nprune/core';
import { logger } from '@/utils/logger/index.js';
import { style } from '@/utils/style/index.js';
import {
  fetchReleaseNotes,
  releaseNotesUrl,
  type ReleaseNotes,
  type ReleaseSectionKey,
} from './releases.js';
import { VERSION_OUTPUT_UNGATED } from './version.js';

/** Section keys in the order worth showing (risk first, noise last). */
const SECTION_ORDER: ReleaseSectionKey[] = [
  'breaking',
  'security',
  'added',
  'changed',
  'fixed',
  'removed',
  'performance',
];

const SECTION_LABEL: Record<ReleaseSectionKey, string> = {
  breaking: 'Breaking',
  security: 'Security',
  added: 'Added',
  changed: 'Changed',
  fixed: 'Fixed',
  removed: 'Removed',
  performance: 'Performance',
};

const STREAM_LABEL: Record<string, string> = {
  cli: 'CLI',
  core: 'Core',
  extension: 'Extension',
  desktop: 'Desktop',
};

/**
 * Styled, prefixed-free lines for one stream's notes.
 *
 * Pure given the current {@link style} state — with **no color** (`--no-color` / non-TTY) it
 * returns plain text, so the block stays readable when styling is off.
 */
export function renderStreamNotes(notes: ReleaseNotes): string[] {
  const label = STREAM_LABEL[notes.stream] ?? notes.stream;
  const lines: string[] = [
    `${style.bold(style.ok(`${label} v${notes.version}`))} ${style.dim(`— ${notes.date}`)}`,
    `  ${notes.summary}`,
  ];

  for (const key of SECTION_ORDER) {
    const items = notes.sections?.[key] ?? [];
    if (items.length === 0) continue;
    lines.push(`  ${style.bold(SECTION_LABEL[key])}`);
    for (const item of items) lines.push(`    ${style.dim('•')} ${item}`);
  }

  lines.push(`  ${style.dim('→')} ${style.dim(releaseNotesUrl(notes.stream, notes.version))}`);
  return lines;
}

/**
 * `i18nprune version --notes` — release notes for the installed CLI **and** Core (the CLI
 * bundles core, so both matter). Reads the releases portal; degrades to a warning when the
 * portal is unreachable or the version is not published yet.
 */
export async function runVersionNotesCommand(run: RunOptions): Promise<void> {
  const [cliNotes, coreNotes] = await Promise.all([
    fetchReleaseNotes('cli', CLI_VERSION),
    fetchReleaseNotes('core', SDK_VERSION),
  ]);

  const found = [cliNotes, coreNotes].filter((n): n is ReleaseNotes => n !== null);
  if (found.length === 0) {
    logger.warn(
      `No release notes found for CLI ${CLI_VERSION} / Core ${SDK_VERSION} (portal unreachable, or this version is not published yet).`,
      run,
      VERSION_OUTPUT_UNGATED,
    );
    return;
  }

  for (const notes of found) {
    logger.primary(renderStreamNotes(notes).join('\n'), run, VERSION_OUTPUT_UNGATED);
  }
}
