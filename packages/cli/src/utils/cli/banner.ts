import type { Command } from 'commander';
import { CLI_NAME, CLI_ROOT_TAGLINE, CONFIG_BASE_NAME } from '@/constants/cli.js';
import { getRunOptions } from '@i18nprune/core';
import { header } from '@/utils/ansi/index.js';
import { canEmit } from '@/utils/logger/policy.js';
import { logger } from '@/utils/logger/index.js';
import { getCommandInvocationPath } from '@/utils/cli/path.js';
import type { CommandBannerSpec } from '@/types/utils/cli/banner.js';
import { maybePrintUpdateNoticeAfterBanner } from '@/utils/update/notice.js';

const ROOT = CLI_NAME;

/**
 * Subtitles for command banners and **`--help`** (titles are derived via {@link toolDisplayTitle}).
 * Keys are invocation paths from {@link getCommandInvocationPath} (e.g. `locales list`).
 */
export const COMMAND_BANNER_LABELS: Record<string, CommandBannerSpec> = {
  init: { subtitle: `create ${CONFIG_BASE_NAME}.*` },
  config: { subtitle: 'paths, env, provenance' },
  validate: { subtitle: 'code ↔ source locale JSON' },
  missing: { subtitle: 'scaffold keys into locale JSON' },
  sync: { subtitle: 'merge + prune to source' },
  generate: { subtitle: 'generate translations from source' },
  quality: { subtitle: 'parity / drift' },
  review: { subtitle: 'locale summaries vs source' },
  cleanup: { subtitle: 'unused keys · static scan (--rg optional)' },
  languages: { subtitle: 'BCP47-style codes for generate' },
  providers: { subtitle: 'translation backends · env + config' },
  doctor: { subtitle: 'Node, rg, config, paths' },
  patch: { subtitle: 'analyze · --init scaffold' },
  locales: { subtitle: 'list + edit under localesDir' },
  'locales list': { subtitle: 'files and key counts under localesDir' },
  'locales dynamic': { subtitle: 'non-literal translation keys' },
  'locales delete': { subtitle: 'remove locale JSON (+ meta)' },
  kits: { subtitle: 'read-only audit reports' },
  'kits dynamic': { subtitle: 'non-literal key call sites' },
  'kits identical': { subtitle: 'source-identical leaves per locale' },
  'kits honest': { subtitle: 'validate + dynamic + quality + review' },
  'kits baseline': { subtitle: 'signal snapshot · optional delta' },
  'kits pr': { subtitle: 'PR markdown audit summary' },
  report: { subtitle: 'project report · html/json/csv/text' },
  share: { subtitle: 'hosted snapshots and report links' },
  'share upload': { subtitle: 'upload snapshot or report JSON' },
  'share list': { subtitle: 'cached uploads for this project' },
  'share view': { subtitle: 'live worker metadata' },
  'share delete': { subtitle: 'remove cache row and remote copy' },
  version: { subtitle: 'CLI semver · npm registry check' },
};

function fallbackSubtitleFromPath(path: string): string {
  return path.replace(/ /g, ' · ');
}

/**
 * Title for banners and help headers: root → **`I18nprune`**; **`locales list`** → **`Locales List`**.
 */
export function toolDisplayTitle(cmd: Command): string {
  const path = getCommandInvocationPath(cmd, ROOT);
  if (!path) {
    return CLI_NAME.charAt(0).toUpperCase() + CLI_NAME.slice(1);
  }
  return path
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Subtitle for **`--help`** / box banner: labels table, else first line of **`cmd.description()`**, else path fallback.
 * Caps length so a missing label never blows the box across the terminal.
 */
export function getTopicBannerSubtitle(cmd: Command): string {
  const path = getCommandInvocationPath(cmd, ROOT);
  if (!path) return CLI_ROOT_TAGLINE;
  const spec = COMMAND_BANNER_LABELS[path];
  if (spec?.subtitle) return spec.subtitle;
  const desc = cmd.description();
  const first = desc.trim().split('\n')[0]?.trim();
  if (first) return truncateBannerSubtitle(first);
  return fallbackSubtitleFromPath(path);
}

/** Soft cap for banner subtitles when falling back to Commander descriptions. */
const BANNER_SUBTITLE_MAX = 64;

function truncateBannerSubtitle(text: string): string {
  if (text.length <= BANNER_SUBTITLE_MAX) return text;
  return `${text.slice(0, BANNER_SUBTITLE_MAX - 1).trimEnd()}…`;
}

/**
 * Print the standard top banner once per invocation when appropriate:
 * **off** for `--json` and **`-s` / `--silent`**; **on** for **`-q` / `--quiet`** (still readable).
 * Skips the **`help`** subcommand — its action prints **`program.outputHelp()`** or **`cmd.helpInformation()`**, which already prepend the same box via **`formatHelp`**; printing here would duplicate it (e.g. **Help** + **I18nprune** for **`i18nprune help`**).
 *
 * When a newer npm version is cached, prints a **`[notice]`** update line after the header (registry-confirmed when online).
 */
export async function maybePrintCommandBanner(actionCommand: Command): Promise<void> {
  const run = getRunOptions();
  if (!canEmit(run, 'banner')) return;
  if (actionCommand.name() === 'help') return;
  if (actionCommand.commands.length > 0) return;

  const path = getCommandInvocationPath(actionCommand, ROOT);
  const spec = COMMAND_BANNER_LABELS[path] ?? {};
  const title = toolDisplayTitle(actionCommand);
  const subtitle = getTopicBannerSubtitle(actionCommand);

  logger.decorative.blank(run);
  logger.decorative.printHeader(title, header, { subtitle, mark: spec.mark }, run);
  await maybePrintUpdateNoticeAfterBanner(run, path);
  logger.decorative.blank(run);
}
