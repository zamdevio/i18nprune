#!/usr/bin/env node

import { ensureLanguageCatalogFile } from '../../../scripts/catalog/ensure.js';
import { Command } from 'commander';

ensureLanguageCatalogFile();
import { preprocessArgv, resolveHelpTopicToken } from '@/argv/index.js';
import { ensureConfig } from '@/commands/init/index.js';
import {
  clearContextCache,
  setCliGlobalOverrides,
  resetCliGlobals,
} from '@/shared/context/index.js';
import { resetRunOptions, setRunOptions } from '@i18nprune/core';
import { ensureConfigPathResolved, setConfigPath } from '@/shared/config/index.js';
import { emitI18nPruneHomeOverrideNotice } from '@/shared/home/index.js';
import {
  setCliYesFlag,
  getCliYesFlag,
  setArgvJsonFlag,
  setCliListTopFlag,
  setCliListFullFlag,
} from '@/shared/context/globals.js';
import { reportCliError } from '@/shared/errors/handler.js';
import { generate } from '@/commands/generate/index.js';
import { sync } from '@/commands/sync/index.js';
import { validate } from '@/commands/validate/index.js';
import { missing } from '@/commands/missing/index.js';
import { quality } from '@/commands/quality/index.js';
import { cleanup } from '@/commands/cleanup/index.js';
import { resolveCleanupRg } from '@/commands/cleanup/flags.js';
import { languages } from '@/commands/languages/index.js';
import { providers } from '@/commands/providers/index.js';
import { config } from '@/commands/config/index.js';
import { review } from '@/commands/review/index.js';
import { doctor } from '@/commands/doctor/index.js';
import { patch } from '@/commands/patch/index.js';
import { localesList, localesDynamic, localesDelete } from '@/commands/locales/index.js';
import { shareUpload, shareList, shareView, shareDelete } from '@/commands/share/index.js';
import { kitsBaseline, kitsDynamic, kitsHonest, kitsIdentical, kitsPr } from '@/commands/kits/index.js';
import { report } from '@/commands/report/index.js';
import { serve } from '@/serve/index.js';
import { configureCliHelp } from '@/commands/help/index.js';
import { CLI_NAME, CLI_ROOT_DESCRIPTION } from '@/constants/cli.js';
import { maybePrintCommandBanner } from '@/utils/cli/banner.js';
import { resolveJsonOutputCommandId } from '@/utils/cli/jsonOutputCommand.js';
import { parseCliPositiveIntTop } from '@/utils/cli/top.js';
import {
  ISSUE_CLI_INVALID_JSON_PRETTY,
  ISSUE_REPORT_INVALID_FORMAT,
} from '@i18nprune/core';
import type { ReportCommandFormat } from '@/types/command/report/index.js';
import type { ReportCliJsonPayload } from '@/types/command/report/json.js';
import type { ProjectReportDocument } from '@/types/command/report/index.js';
import { ensureUpdateCacheRefreshed } from '@/utils/update/index.js';
import { printCurrentVersionLine, runVersionCheckCommand, runVersionResetCommand } from '@/utils/update/version.js';
import { getRunOptions, type ScanDebugEvent } from '@i18nprune/core';
import { emitCliJsonOptionError } from '@/shared/result/optionErrorEnvelope.js';
import { logger } from '@/utils/logger/index.js';
import { resolveNoColor } from '@/utils/cli/noColor.js';
import { configureStyleFromRun } from '@/utils/style/index.js';

function parseReportCommandFormat(s: string | undefined): ReportCommandFormat {
  const x = (s ?? 'html').trim().toLowerCase();
  if (x === 'html' || x === 'json' || x === 'csv' || x === 'text') return x;
  throw new Error(`Invalid --format: expected html, json, csv, or text (got ${s ?? ''})`);
}

function parseExcludeDirsCsv(s: string | undefined): string[] | undefined {
  if (s === undefined || !String(s).trim()) return undefined;
  const parts = String(s)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function parseCacheProfileOption(value: string | undefined): 'safe' | 'balanced' | 'fast' | undefined {
  if (value === undefined) return undefined;
  const x = value.trim().toLowerCase();
  if (x === 'safe' || x === 'balanced' || x === 'fast') return x;
  throw new Error(`Invalid --cache-profile: expected safe, balanced, or fast (got ${value})`);
}

function parseBooleanOption(name: string, value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const x = value.trim().toLowerCase();
  if (x === 'true' || x === '1' || x === 'yes' || x === 'y' || x === 'on') return true;
  if (x === 'false' || x === '0' || x === 'no' || x === 'n' || x === 'off') return false;
  throw new Error(`Invalid ${name}: expected true or false (got ${value})`);
}

const program = new Command();
configureCliHelp(program);

function parseOptionalTranslateParallelFlag(raw: string | undefined, label: string): number | undefined {
  if (raw === undefined || raw === '') return undefined;
  return parseCliPositiveIntTop(raw, label);
}

program
  .name(CLI_NAME)
  .description(CLI_ROOT_DESCRIPTION)
  .option(
    '-c, --config <path>',
    'path to i18nprune.config (.ts, .mts, .js, .mjs — not JSON)',
  )
  .option(
    '-y, --yes',
    'if no config file exists, write defaults without prompting (same as global --json for that bootstrap)',
    false,
  )
  .option(
    '-j, --json',
    'machine-readable output (only commands that support it; e.g. config, init, validate, generate, doctor — ignored for help)',
    false,
  )
  .option(
    '-jp, --json-pretty <bool>',
    'when --json is enabled, pretty-print JSON (kits: minified unless -jp true)',
    'true',
  )
  .option('-q, --quiet', 'less non-essential output', false)
  .option('-s, --silent', 'suppress informational and warning lines (errors still print)', false)
  .option('-ncl, --no-color', 'plain text output (also when NO_COLOR is set)')
  .option('-nlc, --no-log-channel', 'omit [info]/[warn]/[tip] tags on human log lines')
  .option('-nlp, --no-log-prefix', 'omit [i18nprune] prefix on human log lines')
  .option('--source <code>', 'override source locale language code (BCP47, e.g. en, pt-br)')
  .option('-ld, --locales-dir <path>', 'override locales directory')
  .option('--src <path>', 'override scan root (translation call sites)')
  .option(
    '-fns, --functions <list>',
    'comma-separated translation helpers (e.g. t,i18n.t,$t)',
  )
  .option(
    '-e, --exclude <list>',
    'comma-separated directory basenames to skip while scanning sources (appended to config exclude.dirs; e.g. bench,vendor)',
  )
  .option('-p, --patch', 'enable patching for this run (overrides config patching.enabled=false)', false)
  .option('-nch, --no-cache', 'disable CLI cache for this run only')
  .option(
    '-cp, --cache-profile <id>',
    'override cache.profile for this run (safe | balanced | fast); explicit cache.rebuild / fullRescanThresholdPercent / mode in config still win',
  )
  .option(
    '-dc, --debug-cache',
    'log report-cache dispatch, invalidation, and per-file delta decisions',
    false,
  )
  .option(
    '-ds, --debug-scan',
    'log source scan skip decisions to stderr (built-in skips, exclude rules, non-scanned extensions)',
    false,
  )
  .option('-T, --top <n>', 'global list limit for human/list outputs (default: 3 per command; use --full for all)')
  .option('-F, --full', 'global full list mode (still bounded by core hard cap)', false)
  .hook('preAction', async (_thisCommand, actionCommand) => {
    const opts = program.opts<{
      config?: string;
      yes?: boolean;
      source?: string;
      localesDir?: string;
      src?: string;
      functions?: string;
      exclude?: string;
      patch?: boolean;
      cache?: boolean;
      top?: string;
      full?: boolean;
      json?: boolean;
      jsonPretty?: string;
      quiet?: boolean;
      silent?: boolean;
      color?: boolean;
      logChannel?: boolean;
      logPrefix?: boolean;
      debugScan?: boolean;
      debugCache?: boolean;
      cacheProfile?: string;
    }>();
    setConfigPath(opts.config);
    clearContextCache();
    resetRunOptions();
    resetCliGlobals();
    setArgvJsonFlag(Boolean(opts.json));
    await ensureConfigPathResolved();
    const silent = Boolean(opts.silent);
    const quiet = Boolean(opts.quiet) || silent;
    const cmdName = actionCommand.name();
    const jsonCommandId = resolveJsonOutputCommandId(actionCommand, CLI_NAME);
    const jsonOutput = Boolean(opts.json) && jsonCommandId !== null;
    let jsonPretty: boolean;
    try {
      jsonPretty = parseBooleanOption('--json-pretty', opts.jsonPretty, true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const emitted = emitCliJsonOptionError({
        command: jsonCommandId ?? cmdName,
        json: jsonOutput,
        issueCode: ISSUE_CLI_INVALID_JSON_PRETTY,
        message,
        docPath: 'cli/README',
      });
      if (emitted) {
        process.exit();
      }
      throw err;
    }
    const debugScan = Boolean(opts.debugScan);
    const debugCache = Boolean(opts.debugCache);
    const noColor = resolveNoColor(opts.color === false);
    const noLogChannel = opts.logChannel === false;
    const noLogPrefix = opts.logPrefix === false;
    const runOpts = {
      json: jsonOutput,
      jsonPretty,
      quiet,
      silent,
      noColor,
      noLogChannel,
      noLogPrefix,
      debugScan,
      debugCache,
      onScanDebug:
        debugScan && !silent
          ? (event: ScanDebugEvent) => {
              const msg =
                event.kind === 'skip_directory'
                  ? `skip dir ${event.relativePath}: ${event.reason}`
                  : `skip file ${event.relativePath}: ${event.reason}`;
              logger.scan(msg, getRunOptions());
            }
          : undefined,
    };
    setRunOptions(runOpts);
    configureStyleFromRun(runOpts);
    // `serve` owns a machine protocol on stdout. Bail out of the human pre-action pipeline entirely
    // before ANY stdout-touching step (home-override notice, banner, update notice, global overrides):
    // the home notice is still printed here by design, and it would corrupt the protocol stream.
    // `serve()` sets its own silent RunOptions and wires handlers itself.
    if (actionCommand.name() === 'serve') {
      return;
    }
    emitI18nPruneHomeOverrideNotice(runOpts);
    setCliListTopFlag(parseCliPositiveIntTop(opts.top, 'global: --top'));
    setCliListFullFlag(Boolean(opts.full));
    await ensureUpdateCacheRefreshed({ jsonOutput });
    const excludeDirs = parseExcludeDirsCsv(opts.exclude);
    const cacheProfile = parseCacheProfileOption(opts.cacheProfile);
    setCliGlobalOverrides({
      ...(opts.source !== undefined ? { source: opts.source } : {}),
      ...(opts.localesDir !== undefined ? { localesDir: opts.localesDir } : {}),
      ...(opts.src !== undefined ? { src: opts.src } : {}),
      ...(opts.functions !== undefined ? { functions: opts.functions } : {}),
      ...(excludeDirs ? { scanExcludeDirNames: excludeDirs } : {}),
      ...(opts.patch === true ? { patch: true } : {}),
      ...(opts.cache === false ? { noCache: true } : {}),
      ...(cacheProfile !== undefined ? { cacheProfile } : {}),
    });
    setCliYesFlag(Boolean(opts.yes));
    if (actionCommand.name() !== CLI_NAME) {
      await maybePrintCommandBanner(actionCommand);
    }
  });

program
  .command('init')
  .description(
    'Create i18nprune.config.* when missing (interactive / --yes / --auto / --rich / --preset)',
  )
  .option('--rich', 'write expanded starter config (all namespaces + safe defaults)', false)
  .option(
    '-a, --auto',
    'pick a starter preset from project signals (ambiguous projects exit 1 unless --preset is set)',
    false,
  )
  .option(
    '--preset <id>',
    'starter preset: generic | i18next | lingui | next-i18next | next-intl | react-intl',
  )
  .action(async (opts: { rich?: boolean; auto?: boolean; preset?: string }) => {
    await ensureConfig({
      yes: getCliYesFlag(),
      rich: Boolean(opts.rich),
      auto: Boolean(opts.auto),
      preset: opts.preset,
    });
  });

program
  .command('config')
  .description('Show resolved config, paths, and I18NPRUNE_* env snapshot (use global --json)')
  .action(async () => {
    await config();
  });

program
  .command('validate')
  .description('Literal translation keys in code exist in source JSON')
  .action(async () => {
    await validate({});
  });

program
  .command('missing')
  .description('Add keys used in code but missing from source or a locale JSON (placeholders)')
  .option('-t, --target <codes>', 'target locale code(s): one code, comma-separated list, or "all" (default: source locale file)')
  .option('-n, --dry-run', 'list paths only; do not write', false)
  .action(async (opts: { target?: string; dryRun?: boolean }) => {
    await missing({
      target: opts.target,
      dryRun: Boolean(opts.dryRun),
    });
  });

program
  .command('sync')
  .description('Align locale file shapes to the source (merge + prune; honors policies.preserve)')
  .option('-n, --dry-run', 'show targets only; do not write files', false)
  .option(
    '-m, --metadata',
    'write/repair structured locale leaves (`{ value, status, confidence, needsReview, source }`)',
    false,
  )
  .option(
    '-sm, --strip-metadata',
    'rewrite structured `{ value, ... }` leaves to plain strings during sync (default from config localeLeaves.sync.stripMetadata)',
    false,
  )
  .option(
    '-t, --target <codes>',
    'comma-separated locale basenames, or "all" (default: all non-source locales under localesDir)',
  )
  .option(
    '-nrsl, --no-repair-sentinel-leaks',
    'skip automatic copy-source repair of stale __I18NPRUNE_* target leaves',
    false,
  )
  .action(async (opts: { dryRun?: boolean; target?: string; stripMetadata?: boolean; metadata?: boolean; noRepairSentinelLeaks?: boolean }) => {
    await sync({
      dryRun: Boolean(opts.dryRun),
      target: opts.target,
      metadata: opts.metadata === true,
      stripMetadata: opts.stripMetadata === true,
      noRepairSentinelLeaks: opts.noRepairSentinelLeaks === true ? true : undefined,
    });
  });

program
  .command('generate')
  .description(
    'Generate a target locale JSON from the source, or top up existing files with --resume',
  )
  .option('-t, --target <codes>', 'target locale code(s): one code or comma-separated list (e.g. ja,ar,id)')
  .option('-f, --force', 're-translate even if target already has every source string path', false)
  .option('-n, --dry-run', 'do not call translator or write files', false)
  .option(
    '-m, --metadata',
    'write/repair structured locale leaves (`{ value, status, confidence, needsReview, source }`)',
    false,
  )
  .option(
    '-P, --provider <id>',
    'translation backend — precedence: --provider → I18NPRUNE_TRANSLATE_PROVIDER → translate.primary; credentials: translate.providers row + env (see docs/config/translate.md)',
  )
  .option(
    '-W, --workers <n>',
    'max parallel translateLeaf calls this run (overrides I18NPRUNE_TRANSLATE_MAX_WORKERS, translate.workers)',
  )
  .option(
    '-R, --resume',
    'top-up existing locale JSON: translate review-eligible leaves that still match the source (requires existing <target>.json)',
    false,
  )
  .option('--all', 'with --resume: process every non-source locale under localesDir', false)
  .option(
    '--ask',
    'with --resume: confirm before processing targets',
    false,
  )
  .option(
    '-nrsl, --no-repair-sentinel-leaks',
    'skip automatic re-translate of stale __I18NPRUNE_* target leaves',
    false,
  )
  .action(
    async (opts: {
      source?: string;
      target?: string;
      force?: boolean;
      dryRun?: boolean;
      metadata?: boolean;
      provider?: string;
      workers?: string;
      resume?: boolean;
      all?: boolean;
      ask?: boolean;
      noRepairSentinelLeaks?: boolean;
    }) => {
      await generate({
        source: opts.source,
        target: opts.target,
        force: opts.force === true ? true : undefined,
        dryRun: Boolean(opts.dryRun),
        metadata: opts.metadata === true ? true : undefined,
        provider: opts.provider,
        workers: parseOptionalTranslateParallelFlag(opts.workers, 'generate: --workers'),
        resume: opts.resume === true ? true : undefined,
        all: opts.all === true ? true : undefined,
        ask: opts.ask === true ? true : undefined,
        noRepairSentinelLeaks: opts.noRepairSentinelLeaks === true ? true : undefined,
      });
    },
  );

program
  .command('quality')
  .description('Parity / source-identical vs source locale')
  .option('-t, --target <code>', 'only this locale file (basename)')
  .action(async (opts: { target?: string }) => {
    await quality({ target: opts.target });
  });

program
  .command('review')
  .description('Locale review vs source (paths, identical counts, structured leaf stats)')
  .option(
    '-t, --target <codes>',
    'locale basenames: `all` (default), one code, or comma list (`ja`, `ja,ar`); optional `.json` suffix',
  )
  .action(async (opts: { target?: string }) => {
    await review({ target: opts.target });
  });

program
  .command('cleanup')
  .description('Remove unused keys (static scan; --rg optional)')
  .option('-n, --dry-run', 'preview removals; no writes', false)
  .option('--rg', 'enable ripgrep string-presence guard (substring search on translation values in src/)')
  .option(
    '-t, --target <code>',
    'target locale code(s) to prune: one code, comma-separated list, or all; omit for source-locale cleanup',
  )
  .option(
    '--ask',
    'interactive TTY: confirm removals in batches (grouped by top-level key namespace); overridden by global --yes',
    false,
  )
  .option('-apk, --ask-per-key', 'interactive TTY: confirm each unused key path separately', false)
  .action(
    async (opts: {
      dryRun?: boolean;
      rg?: boolean;
      target?: string;
      ask?: boolean;
      askPerKey?: boolean;
    }) => {
      await cleanup({
        dryRun: Boolean(opts.dryRun),
        rg: resolveCleanupRg(opts),
        target: opts.target,
        ask: Boolean(opts.ask),
        askPerKey: Boolean(opts.askPerKey),
      });
    },
  );

program
  .command('languages')
  .alias('langs')
  .description('List supported generate target languages')
  .option('-flt, --filter <text>', 'match code, English, or native (case-insensitive substring)')
  .option(
    '-tbl, --table',
    'bordered table with a No. column (default is a numbered list, best for mixed scripts)',
    false,
  )
  .action(async (opts: { filter?: string; table?: boolean }) => {
    await languages({
      filter: opts.filter,
      table: opts.table === true ? true : undefined,
    });
  });

program
  .command('providers')
  .description('List translation backends for generate (ids, env, config)')
  .action(async () => {
    await providers();
  });

const SHARE_CMD_DESCRIPTION =
  'Upload hosted project snapshots/reports; list, view, or delete cache rows.';

const SHARE_SUBCOMMANDS = ['upload', 'list', 'view', 'delete'] as const;

const shareCmd = program
  .command('share')
  .description(SHARE_CMD_DESCRIPTION)
  .action((_, cmd) => {
    const unknown = typeof cmd?.args?.[0] === 'string' ? cmd.args[0] : undefined;
    if (unknown && !SHARE_SUBCOMMANDS.includes(unknown as (typeof SHARE_SUBCOMMANDS)[number])) {
      if (unknown === 'uplaod') {
        console.error('Unknown share subcommand "uplaod". Did you mean `i18nprune share upload`?');
      } else {
        console.error(`Unknown share subcommand "${unknown}". Try: ${SHARE_SUBCOMMANDS.join(', ')}.`);
      }
      process.exitCode = 1;
      return;
    }
    shareCmd.help({ error: false });
  });

/** Upload flags on `share upload` so `share delete --project <id>` is not eaten by boolean `--project`. */
shareCmd
  .command('upload')
  .description('Upload prepared project snapshot or report JSON to the worker')
  .option('--project', 'Upload prepared project snapshot (JSON) to the worker')
  .option('--report', 'Upload report JSON to the worker (stored report link)')
  .option('--from <file>', 'Report JSON path (with --report; default: scan in-process)')
  .option('-wu, --worker-url <url>', 'Worker API base URL (default: I18NPRUNE_WORKER_URL or https://worker.i18nprune.dev)')
  .option('--force', 'Ignore hash-based skip and re-upload', false)
  .action(async (opts: { project?: boolean; report?: boolean; from?: string; workerUrl?: string; force?: boolean }) => {
    await shareUpload({
      project: Boolean(opts.project),
      report: Boolean(opts.report),
      from: opts.from,
      workerUrl: opts.workerUrl,
      force: Boolean(opts.force),
    });
  });

shareCmd
  .command('list')
  .description('List cached upload rows from share.json')
  .option('--project <id>', 'Filter to one worker project id')
  .option('--report <id>', 'Filter to one worker report id')
  .option('-wu, --worker-url <url>', 'Worker base URL hint when filtering (unused for list-only)')
  .action(async (opts: { project?: string; report?: string; workerUrl?: string }) => {
    await shareList(opts);
  });

shareCmd
  .command('view')
  .description('Fetch live worker metadata for a hosted project or report id')
  .option('--project <id>', 'Worker-hosted project id')
  .option('--report <id>', 'Worker-hosted report id')
  .option('-wu, --worker-url <url>', 'Worker API base URL')
  .option(
    '-v, --verbose',
    'Include processor, extraction, cache, and timing sections (human and --json)',
    false,
  )
  .action(async (opts: {
    project?: string;
    report?: string;
    workerUrl?: string;
    verbose?: boolean;
  }) => {
    await shareView({
      project: opts.project,
      report: opts.report,
      workerUrl: opts.workerUrl,
      verbose: Boolean(opts.verbose),
    });
  });

shareCmd
  .command('delete')
  .description('Remove share.json row and/or DELETE the worker copy')
  .option('--project <id>', 'Worker-hosted project id')
  .option('--report <id>', 'Worker-hosted report id')
  .option('-wu, --worker-url <url>', 'Worker API base URL')
  .option('-lo, --local-only', 'Remove share.json entry only; do not call worker DELETE', false)
  .option('--all', 'Delete every share.json row for this project (TTY confirms unless --yes)', false)
  .action(async (opts: {
    project?: string;
    report?: string;
    workerUrl?: string;
    localOnly?: boolean;
    all?: boolean;
  }) => {
    await shareDelete({
      project: opts.project,
      report: opts.report,
      workerUrl: opts.workerUrl,
      localOnly: Boolean(opts.localOnly),
      all: Boolean(opts.all),
    });
  });

const localesCmd = program
  .command('locales')
  .description('Locale JSON under localesDir (list / dynamic / delete)')
  .action(() => {
    localesCmd.help({ error: false });
  });

localesCmd
  .command('list')
  .description('List locale files and key/path counts under localesDir')
  .action(async () => {
    await localesList();
  });

localesCmd
  .command('dynamic')
  .description(
    'List heuristic non-literal translation key sites under src (read-only; no locale writes)',
  )
  .action(async () => {
    await localesDynamic();
  });

localesCmd
  .command('delete')
  .description(
    'Delete a target locale JSON (and .meta.json if present); future: loader auto-patches',
  )
  .option('-t, --target <codes>', 'locale code(s): one code, comma-separated list, or "all"')
  .option('--ask', 'interactive TTY: require one extra confirmation before delete', false)
  .action(async (opts: { target?: string; ask?: boolean }) => {
    await localesDelete({ target: opts.target, ask: Boolean(opts.ask) });
  });

const KITS_SUBCOMMANDS = ['dynamic', 'identical', 'honest', 'baseline', 'pr'] as const;

function parseKitsMaxDynamic(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === '') return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error('Invalid --max-dynamic: expected a non-negative number.');
  }
  return n;
}

const kitsCmd = program
  .command('kits')
  .description('Read-only audit reports (dynamic, identical, honest, baseline, pr).')
  .action((_, cmd) => {
    const unknown = typeof cmd?.args?.[0] === 'string' ? cmd.args[0] : undefined;
    if (unknown && !KITS_SUBCOMMANDS.includes(unknown as (typeof KITS_SUBCOMMANDS)[number])) {
      console.error(`Unknown kits subcommand "${unknown}". Try: ${KITS_SUBCOMMANDS.join(', ')}.`);
      process.exitCode = 1;
      return;
    }
    kitsCmd.help({ error: false });
  });

kitsCmd
  .command('dynamic')
  .description('List dynamic translation key call sites (read-only).')
  .option('-t, --target <code>', 'optional locale filter (reserved)')
  .option('-o, --out <path>', 'write output to file')
  .option('-fon, --fail-on <list>', 'comma-separated policy gates (issues,dynamic,missing,source-identical)')
  .option('-mxdy, --max-dynamic <n>', 'fail when dynamic site count exceeds n')
  .option('-b, --baseline <path>', 'compare against a saved JSON baseline (project-relative)')
  .option('-sb, --save-baseline <path>', 'save terminal-matching report (.md default; -j → .json)')
  .option('-cn, --contains <text>', 'filter sites by substring in file path or preview')
  .action(async (opts: {
    target?: string;
    out?: string;
    failOn?: string;
    maxDynamic?: string;
    baseline?: string;
    saveBaseline?: string;
    contains?: string;
  }) => {
    await kitsDynamic({
      target: opts.target,
      out: opts.out,
      failOn: opts.failOn,
      maxDynamic: parseKitsMaxDynamic(opts.maxDynamic),
      baseline: opts.baseline,
      saveBaseline: opts.saveBaseline,
      contains: opts.contains,
    });
  });

kitsCmd
  .command('identical')
  .description('Source-identical leaf paths per locale (parity excludes unless --raw).')
  .option('-t, --target <code>', 'optional locale filter')
  .option('-o, --out <path>', 'write output to file')
  .option('-fon, --fail-on <list>', 'comma-separated policy gates')
  .option('-b, --baseline <path>', 'compare against a saved JSON baseline')
  .option('-sb, --save-baseline <path>', 'save terminal-matching report')
  .option('-r, --raw', 'disable policies.parity excludes', false)
  .option('--strict', 'exit 2 when any source-identical leaves are found', false)
  .action(async (opts: {
    target?: string;
    out?: string;
    failOn?: string;
    baseline?: string;
    saveBaseline?: string;
    raw?: boolean;
    strict?: boolean;
  }) => {
    await kitsIdentical({
      target: opts.target,
      out: opts.out,
      failOn: opts.failOn,
      baseline: opts.baseline,
      saveBaseline: opts.saveBaseline,
      raw: Boolean(opts.raw),
      strict: Boolean(opts.strict),
    });
  });

kitsCmd
  .command('honest')
  .description('Combined validate + dynamic + quality + review audit.')
  .option('-t, --target <code>', 'optional locale filter')
  .option('-o, --out <path>', 'write output to file')
  .option('-fon, --fail-on <list>', 'comma-separated policy gates')
  .option('-mxdy, --max-dynamic <n>', 'fail when dynamic site count exceeds n')
  .option('-b, --baseline <path>', 'compare against a saved JSON baseline')
  .option('-sb, --save-baseline <path>', 'save terminal-matching report')
  .option('-fcs, --focus <text>', 'filter dynamic sites by substring')
  .option('--strict', 'exit 2 on missing keys or source-identical leaves', false)
  .action(async (opts: {
    target?: string;
    out?: string;
    failOn?: string;
    maxDynamic?: string;
    baseline?: string;
    saveBaseline?: string;
    focus?: string;
    strict?: boolean;
  }) => {
    await kitsHonest({
      target: opts.target,
      out: opts.out,
      failOn: opts.failOn,
      maxDynamic: parseKitsMaxDynamic(opts.maxDynamic),
      baseline: opts.baseline,
      saveBaseline: opts.saveBaseline,
      focus: opts.focus,
      strict: Boolean(opts.strict),
    });
  });

kitsCmd
  .command('baseline')
  .description('Signal snapshot (missing, dynamic, source-identical); optional delta.')
  .option('-t, --target <code>', 'optional locale filter')
  .option('-o, --out <path>', 'write output to file')
  .option('-b, --baseline <path>', 'compare against a saved JSON baseline')
  .option('-sb, --save-baseline <path>', 'save terminal-matching report')
  .action(async (opts: { target?: string; out?: string; baseline?: string; saveBaseline?: string }) => {
    await kitsBaseline({
      target: opts.target,
      out: opts.out,
      baseline: opts.baseline,
      saveBaseline: opts.saveBaseline,
    });
  });

kitsCmd
  .command('pr')
  .description('PR markdown audit summary (counts + dynamic samples).')
  .option('-t, --target <code>', 'optional locale filter')
  .option('-o, --out <path>', 'write output to file')
  .option('-sb, --save-baseline <path>', 'save terminal-matching report')
  .option('-fcs, --focus <text>', 'filter dynamic sites by substring')
  .action(async (opts: { target?: string; out?: string; saveBaseline?: string; focus?: string }) => {
    await kitsPr({
      target: opts.target,
      out: opts.out,
      saveBaseline: opts.saveBaseline,
      focus: opts.focus,
    });
  });

program
  .command('report')
  .description('Project report from live scan or --from JSON (html/json/csv/text)')
  .option('-fmt, --format <fmt>', 'output: html, json, csv, or text', 'html')
  .option('-o, --out <path>', 'output file (default: report-<timestamp>.<ext> in cwd)', undefined)
  .option('--from <file>', 'read project report JSON (must match schema) instead of scanning', undefined)
  .action(async (opts: { format?: string; out?: string; from?: string }) => {
    let format: ReportCommandFormat;
    try {
      format = parseReportCommandFormat(opts.format);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const emitted = emitCliJsonOptionError({
        command: 'report',
        json: getRunOptions().json,
        issueCode: ISSUE_REPORT_INVALID_FORMAT,
        message,
        docPath: 'commands/report/README',
        data: {
          kind: 'report',
          format: 'html',
          outputPath: null,
          document: {} as ProjectReportDocument,
        } satisfies ReportCliJsonPayload,
      });
      if (emitted) {
        return;
      }
      throw err;
    }
    await report({ format, out: opts.out, from: opts.from });
  });

program
  .command('version')
  .description('Print CLI version (--check queries npm; --reset clears update cache)')
  .option('--check', 'fetch latest from the npm registry and show install instructions', false)
  .option(
    '--reset',
    'clear cached npm update check (next automatic lookup runs fresh)',
    false,
  )
  .action(async (opts: { check?: boolean; reset?: boolean }) => {
    const run = getRunOptions();
    if (opts.reset) {
      await runVersionResetCommand(run);
    }
    if (opts.check) {
      await runVersionCheckCommand(run);
    } else {
      printCurrentVersionLine(run);
    }
  });

program
  .command('serve')
  .description(
    'stdio JSON-RPC server for host clients (desktop / editor) — long-only flags; stdout is protocol-only',
  )
  .option(
    '--project <path>',
    'pin the session to one project root (sandbox); omitted = hub mode (root required per request)',
  )
  .option(
    '--allow-writes',
    'enable mutating ops for this session (default: read-only)',
    false,
  )
  .option(
    '--idle-timeout <seconds>',
    'exit after N seconds idle (0 disables; default 900)',
  )
  .action(async (opts: { project?: string; allowWrites?: boolean; idleTimeout?: string }) => {
    await serve({
      project: opts.project,
      allowWrites: Boolean(opts.allowWrites),
      idleTimeout: opts.idleTimeout,
    });
  });

program
  .command('patch')
  .description('Patching analyze/fix; --init scaffolds under src/i18n')
  .option('--init', 'create missing CLI-owned files under <src>/i18n (config.json, loaders.generated.ts); see --force', false)
  .option('--force', 'with --init only: overwrite config.json + loaders.generated.ts and reset patching config block in i18nprune.config.*', false)
  .option('-fx, --fix', 'auto-apply suggested patch metadata corrections without prompt', false)
  .option('--top <n>', 'max inconsistency items to show in patch warning/fix preview (default: 5)')
  .option('--full', 'show full inconsistency preview in patch warnings/fix output (overrides --top)', false)
  .action(async (opts: { init?: boolean; force?: boolean; fix?: boolean; top?: string; full?: boolean }) => {
    const top = getRunOptions().json ? undefined : parseCliPositiveIntTop(opts.top, 'patch: --top');
    await patch({
      init: Boolean(opts.init),
      force: Boolean(opts.force),
      fix: Boolean(opts.fix),
      top,
      full: getRunOptions().json ? false : Boolean(opts.full),
    });
  });

program
  .command('doctor')
  .description(
    'Read-only environment diagnostics (Node, rg, config, paths) — use global --json for CI',
  )
  .option(
    '-on, --only <list>',
    'comma-separated checks: runtime,tools,config,paths (default: all)',
  )
  .option('--strict', 'treat warnings as failures (exit 1)', false)
  .action(async (opts: { only?: string; strict?: boolean }) => {
    await doctor({ only: opts.only, strict: opts.strict === true });
  });

program
  .command('help')
  .argument('[command]', 'command or group (e.g. validate, locales, locales list)')
  .description('Show help for a command or global options')
  .action((cmd?: string) => {
    if (!cmd) {
      program.outputHelp();
      return;
    }
    const parts = cmd
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    let cur: Command | undefined = program;
    let parentGroup: string | null = null;
    for (const p of parts) {
      if (!cur) break;
      const resolved = resolveHelpTopicToken(parentGroup, p);
      const found: Command | undefined = cur.commands.find((c) => c.name() === resolved);
      if (!found) {
        console.error(`Unknown command: ${cmd}`);
        program.outputHelp();
        process.exitCode = 1;
        return;
      }
      parentGroup =
        resolved === 'locales' || resolved === 'share' || resolved === 'kits' ? resolved : null;
      cur = found;
    }
    if (cur && cur !== program) {
      console.log(cur.helpInformation());
    }
  });

program.action(() => {
  program.outputHelp();
});

program.parseAsync(preprocessArgv(process.argv)).catch((err: unknown) => {
  process.exitCode = reportCliError(err);
});
