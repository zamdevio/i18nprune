#!/usr/bin/env node

import { ensureLanguageCatalogFile } from '../../../scripts/catalog/ensure.js';
import { Command } from 'commander';

ensureLanguageCatalogFile();
import { preprocessArgv } from '@/argv/index.js';
import { ensureConfig } from '@/commands/init/index.js';
import {
  clearContextCache,
  resetRunOptions,
  setCliGlobalOverrides,
  resetCliGlobals,
  setRunOptions,
} from '@/shared/context/index.js';
import { ensureConfigPathResolved, setConfigPath } from '@/shared/config/index.js';
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
import { languages } from '@/commands/languages/index.js';
import { providers } from '@/commands/providers/index.js';
import { config } from '@/commands/config/index.js';
import { review } from '@/commands/review/index.js';
import { doctor } from '@/commands/doctor/index.js';
import { patch } from '@/commands/patch/index.js';
import { localesList, localesEdit, localesDynamic, localesDelete } from '@/commands/locales/index.js';
import { report } from '@/commands/report/index.js';
import { configureCliHelp } from '@/commands/help/index.js';
import { CLI_NAME, CLI_ROOT_DESCRIPTION } from '@/constants/cli.js';
import { maybePrintCommandBanner } from '@/utils/cli/banner.js';
import { getCommandInvocationPath } from '@/utils/cli/path.js';
import { parseCliPositiveIntTop } from '@/utils/cli/top.js';
import { COMMANDS_WITH_JSON_OUTPUT } from '@/constants/jsonoutput.js';
import {
  ISSUE_CLI_INVALID_JSON_PRETTY,
  ISSUE_REPORT_INVALID_FORMAT,
} from '@/constants/issueCodes.js';
import type { ReportCommandFormat } from '@/types/command/report/index.js';
import type { ReportCliJsonPayload } from '@/types/command/report/json.js';
import type { ProjectReportDocument } from '@/types/command/report/index.js';
import { ensureUpdateCacheRefreshed } from '@/utils/update/index.js';
import { printCurrentVersionLine, runVersionCheckCommand, runVersionResetCommand } from '@/utils/update/version.js';
import { getRunOptions, type ScanDebugEvent } from '@i18nprune/core';
import { emitCliJsonOptionError } from '@/shared/result/optionErrorEnvelope.js';
import { logger } from '@/utils/logger/index.js';

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
    '--yes',
    'if no config file exists, write defaults without prompting (same as global --json for that bootstrap)',
    false,
  )
  .option(
    '--json',
    'machine-readable output (only commands that support it; e.g. config, validate, generate, doctor — ignored for init/help)',
    false,
  )
  .option(
    '--json-pretty <bool>',
    'when --json is enabled, pretty-print envelope JSON',
    'true',
  )
  .option('-q, --quiet', 'less non-essential output', false)
  .option('-s, --silent', 'suppress informational and warning lines (errors still print)', false)
  .option('--source <path>', 'override source locale JSON path')
  .option('--locales-dir <path>', 'override locales directory')
  .option('--src <path>', 'override scan root (translation call sites)')
  .option(
    '--functions <list>',
    'comma-separated translation helpers (e.g. t,i18n.t,$t)',
  )
  .option(
    '--exclude <list>',
    'comma-separated directory basenames to skip while scanning sources (appended to config exclude.dirs; e.g. bench,vendor)',
  )
  .option('--patch', 'enable patching for this run (overrides config patching.enabled=false)', false)
  .option('--no-cache', 'disable CLI cache for this run only')
  .option(
    '--debug-scan',
    'log source scan skip decisions to stderr (built-in skips, exclude rules, non-scanned extensions)',
    false,
  )
  .option('--top <n>', 'global list limit override for human/list outputs')
  .option('--full', 'global full list mode (still bounded by core hard cap)', false)
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
      debugScan?: boolean;
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
    const jsonOutput =
      Boolean(opts.json) && COMMANDS_WITH_JSON_OUTPUT.has(cmdName);
    let jsonPretty: boolean;
    try {
      jsonPretty = parseBooleanOption('--json-pretty', opts.jsonPretty, true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const emitted = emitCliJsonOptionError({
        command: cmdName,
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
    setRunOptions({
      json: jsonOutput,
      jsonPretty,
      quiet,
      silent,
      debugScan,
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
    });
    const globalTop = jsonOutput ? undefined : parseCliPositiveIntTop(opts.top, 'global: --top');
    setCliListTopFlag(globalTop);
    setCliListFullFlag(jsonOutput ? false : Boolean(opts.full));
    await ensureUpdateCacheRefreshed({ jsonOutput });
    const excludeDirs = parseExcludeDirsCsv(opts.exclude);
    setCliGlobalOverrides({
      ...(opts.source !== undefined ? { source: opts.source } : {}),
      ...(opts.localesDir !== undefined ? { localesDir: opts.localesDir } : {}),
      ...(opts.src !== undefined ? { src: opts.src } : {}),
      ...(opts.functions !== undefined ? { functions: opts.functions } : {}),
      ...(excludeDirs ? { scanExcludeDirNames: excludeDirs } : {}),
      ...(opts.patch === true ? { patch: true } : {}),
      ...(opts.cache === false ? { noCache: true } : {}),
    });
    setCliYesFlag(Boolean(opts.yes));
    if (actionCommand.name() !== CLI_NAME) {
      maybePrintCommandBanner(actionCommand);
    }
    const inv = getCommandInvocationPath(actionCommand, CLI_NAME);
    const skipEnsureConfig = [CLI_NAME, 'languages', 'help', 'init', 'config', 'providers', 'review', 'doctor', 'version'].includes(
      actionCommand.name(),
    );
    if (!skipEnsureConfig) {
      const silentIfExists =
        inv === 'locales' ||
        inv === 'locales list' ||
        inv === 'locales edit' ||
        inv === 'generate' ||
        inv === 'sync' ||
        inv === 'doctor' ||
        inv === 'validate' ||
        inv === 'missing' ||
        inv === 'quality' ||
        inv === 'review' ||
        inv === 'cleanup' ||
        inv === 'report' ||
        inv === 'locales dynamic' ||
        inv === 'locales delete' ||
        inv === 'patch';
      await ensureConfig({ yes: Boolean(opts.yes), silentIfExists });
    }
  });

program
  .command('init')
  .description(
    'Create i18nprune.config.ts (or .mts / .js) when missing — interactive unless --yes; --rich writes every supported namespace with defaults',
  )
  .option('--rich', 'write expanded starter config (all namespaces + safe defaults)', false)
  .action(async (opts: { rich?: boolean }) => {
    await ensureConfig({ yes: getCliYesFlag(), rich: Boolean(opts.rich) });
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
  .option('--target <codes>', 'target locale code(s): one code, comma-separated list, or "all" (default: source locale file)')
  .option('--dry-run', 'list paths only; do not write', false)
  .option(
    '--top <n>',
    `max key paths to show in human listings (default: 10; use --full for all)`,
  )
  .option('--full', 'show every key path in human output (overrides --top)', false)
  .action(
    async (opts: { target?: string; dryRun?: boolean; top?: string; full?: boolean }) => {
      const top = getRunOptions().json ? undefined : parseCliPositiveIntTop(opts.top, 'missing: --top');
      await missing({
        target: opts.target,
        dryRun: Boolean(opts.dryRun),
        top,
        full: getRunOptions().json ? false : Boolean(opts.full),
      });
    },
  );

program
  .command('sync')
  .description('Align locale file shapes to the source (merge + prune; honors policies.preserve)')
  .option('--dry-run', 'show targets only; do not write files', false)
  .option(
    '--metadata',
    'write/repair structured locale leaves (`{ value, status, confidence, needsReview, source }`)',
    false,
  )
  .option(
    '--strip-metadata',
    'rewrite structured `{ value, ... }` leaves to plain strings during sync (default from config localeLeaves.sync.stripMetadata)',
    false,
  )
  .option(
    '--target <codes>',
    'comma-separated locale basenames, or "all" (default: all non-source locales under localesDir)',
  )
  .action(async (opts: { dryRun?: boolean; target?: string; stripMetadata?: boolean; metadata?: boolean }) => {
    await sync({
      dryRun: Boolean(opts.dryRun),
      target: opts.target,
      metadata: opts.metadata === true,
      stripMetadata: opts.stripMetadata === true,
    });
  });

program
  .command('generate')
  .description(
    'Generate a target locale JSON from the source, or top up existing files with --resume',
  )
  .option('--source <path>', 'source JSON path (defaults to resolved config / context)')
  .option('--target <codes>', 'target locale code(s): one code or comma-separated list (e.g. ja,ar,id)')
  .option(
    '--english-name <name>',
    'English label in <lang>.meta.json (default: catalog for --target)',
  )
  .option(
    '--native-name <name>',
    'Native endonym in <lang>.meta.json (default: catalog for --target)',
  )
  .option('--direction <ltr|rtl>', 'layout direction for .meta.json (default ltr)')
  .option('--force', 're-translate even if target already has every source string path', false)
  .option('--dry-run', 'do not call translator or write files', false)
  .option(
    '--metadata',
    'write/repair structured locale leaves (`{ value, status, confidence, needsReview, source }`)',
    false,
  )
  .option(
    '--no-locale-meta',
    'do not write or update <lang>.meta.json (merged with config noLocaleMeta; either true skips)',
    false,
  )
  .option(
    '--provider <id>',
    'translation backend — precedence: --provider → I18NPRUNE_TRANSLATE_PROVIDER → translate.primary; credentials: translate.providers row + env (see docs/config/translate.md)',
  )
  .option(
    '--workers <n>',
    'max parallel translateLeaf calls this run (overrides I18NPRUNE_TRANSLATE_MAX_WORKERS, translate.workers)',
  )
  .option(
    '--resume',
    'top-up existing locale JSON: translate review-eligible leaves that still match the source (requires existing <target>.json)',
    false,
  )
  .option('--all', 'with --resume: process every non-source locale under localesDir', false)
  .option(
    '--ask',
    'normal generate: ask to edit locale meta defaults; with --resume: confirm before processing targets',
    false,
  )
  .action(
    async (opts: {
      source?: string;
      target?: string;
      englishName?: string;
      nativeName?: string;
      direction?: string;
      force?: boolean;
      dryRun?: boolean;
      metadata?: boolean;
      noLocaleMeta?: boolean;
      provider?: string;
      workers?: string;
      resume?: boolean;
      all?: boolean;
      ask?: boolean;
    }) => {
      const direction =
        opts.direction === 'ltr' || opts.direction === 'rtl' ? opts.direction : undefined;
      await generate({
        source: opts.source,
        target: opts.target,
        englishName: opts.englishName,
        nativeName: opts.nativeName,
        direction,
        force: opts.force === true ? true : undefined,
        dryRun: Boolean(opts.dryRun),
        metadata: opts.metadata === true ? true : undefined,
        noLocaleMeta: opts.noLocaleMeta === true ? true : undefined,
        provider: opts.provider,
        workers: parseOptionalTranslateParallelFlag(opts.workers, 'generate: --workers'),
        resume: opts.resume === true ? true : undefined,
        all: opts.all === true ? true : undefined,
        ask: opts.ask === true ? true : undefined,
      });
    },
  );

program
  .command('quality')
  .description('Parity / source-identical vs source locale / drift (uses config policies when implemented)')
  .option('--target <code>', 'only this locale file (basename)')
  .action(async (opts: { target?: string }) => {
    await quality({ target: opts.target });
  });

program
  .command('review')
  .description(
    'Locale review vs source: paths, source-identical counts, structured leaf metadata when present (use global --json)',
  )
  .option(
    '--target <codes>',
    'locale basenames: `all` (default), one code, or comma list (`ja`, `ja,ar`); optional `.json` suffix',
  )
  .action(async (opts: { target?: string }) => {
    await review({ target: opts.target });
  });

program
  .command('cleanup')
  .description('Remove unused keys (optional ripgrep safety on src/)')
  .option('--check-only', 'report only, no writes', false)
  .option('--skip-rg', 'do not run ripgrep (static unused-key list only)', false)
  .option(
    '--ask',
    'interactive TTY: confirm removals in batches (grouped by top-level key namespace); overridden by global --yes',
    false,
  )
  .option('--ask-per-key', 'with --ask, confirm each key separately (noisy)', false)
  .action(
    async (opts: { checkOnly?: boolean; skipRg?: boolean; ask?: boolean; askPerKey?: boolean }) => {
      await cleanup({
        checkOnly: Boolean(opts.checkOnly),
        skipRg: Boolean(opts.skipRg),
        ask: Boolean(opts.ask),
        askPerKey: Boolean(opts.askPerKey),
      });
    },
  );

program
  .command('languages')
  .description(
    'List supported translation target languages (code, English name, native name) for generate',
  )
  .option('--filter <text>', 'match code, English, or native (case-insensitive substring)')
  .option(
    '--table',
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
  .description(
    'List translation backends for generate: ids, env vars, and translate.{ primary, providers } config (from @i18nprune/core)',
  )
  .action(async () => {
    await providers();
  });

const localesCmd = program
  .command('locales')
  .description('Locale JSON under localesDir: list files and edit existing locales (see `i18nprune help locales`).')
  .action(() => {
    localesCmd.help({ error: false });
  });

localesCmd
  .command('list')
  .description('List locale files and key/path counts under localesDir (implementation in progress).')
  .action(async () => {
    await localesList();
  });

localesCmd
  .command('edit')
  .description(
    'Edit an existing locale JSON and your app i18n loader wiring. Future: safe auto-patches for supported loader patterns.',
  )
  .option('--target <code>', 'locale basename (e.g. ja) — must match a *.json in localesDir; prompts if omitted in a TTY')
  .option('--english-name <name>', 'value for englishName in <lang>.meta.json')
  .option('--native-name <name>', 'value for nativeName in <lang>.meta.json')
  .option('--direction <ltr|rtl>', 'value for direction in <lang>.meta.json')
  .action(async (opts: { target?: string; englishName?: string; nativeName?: string; direction?: string }) => {
    const direction = opts.direction === 'rtl' || opts.direction === 'ltr' ? opts.direction : undefined;
    await localesEdit({
      target: opts.target,
      englishName: opts.englishName,
      nativeName: opts.nativeName,
      direction,
    });
  });

localesCmd
  .command('dynamic')
  .description(
    'List heuristic non-literal translation key sites under src (read-only; no locale writes)',
  )
  .option(
    '--top <n>',
    'max dynamic sites listed in output (human and `--json`; default: 10 unless `--full`)',
  )
  .option('--full', 'list every dynamic site in output (human and `--json`; overrides `--top`)', false)
  .action(async (opts: { top?: string; full?: boolean }, cmd: Command) => {
    const root = cmd.parent?.parent;
    const rootOpts =
      typeof root?.opts === 'function' ? (root.opts() as { top?: string; full?: boolean }) : {};
    const top = parseCliPositiveIntTop(opts.top ?? rootOpts.top, 'locales dynamic: --top');
    const rootFull = Boolean(rootOpts.full);
    await localesDynamic({ top, full: Boolean(opts.full) || rootFull });
  });

localesCmd
  .command('delete')
  .description(
    'Delete a target locale JSON (and .meta.json if present); future: loader auto-patches',
  )
  .option('--target <codes>', 'locale code(s): one code, comma-separated list, or "all"')
  .option('--ask', 'interactive TTY: require one extra confirmation before delete', false)
  .action(async (opts: { target?: string; ask?: boolean }) => {
    await localesDelete({ target: opts.target, ask: Boolean(opts.ask) });
  });

program
  .command('report')
  .description(
    'Project-level report from a live scan or a validated prior JSON (--from); use global --json for a stdout envelope (still writes --out unless skipped)',
  )
  .option('--format <fmt>', 'output: html, json, csv, or text', 'html')
  .option('--out <path>', 'output file (default: report-<timestamp>.<ext> in cwd)', undefined)
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
  .description(
    'Print the CLI version; use --check to query npm; use --reset to clear local update state',
  )
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
  .command('patch')
  .description(
    'Patching: analyze (then "patch --fix"); --init fills missing scaffold files; --init --force renews config.json + loaders.generated.ts and resets patching config block defaults',
  )
  .option('--init', 'create missing CLI-owned files under <src>/i18n (config.json, loaders.generated.ts); see --force', false)
  .option('--force', 'with --init only: overwrite config.json + loaders.generated.ts and reset patching config block in i18nprune.config.*', false)
  .option('--fix', 'auto-apply suggested patch metadata corrections without prompt', false)
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
    '--only <list>',
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
    for (const p of parts) {
      if (!cur) break;
      const found: Command | undefined = cur.commands.find((c) => c.name() === p);
      if (!found) {
        console.error(`Unknown command: ${cmd}`);
        program.outputHelp();
        process.exitCode = 1;
        return;
      }
      cur = found;
    }
    if (cur && cur !== program) {
      console.log(cur.helpInformation());
    }
  });

/** Bare `i18nprune` (no subcommand): show help without Commander's error-style exit (code 1). */
program.action(() => {
  program.outputHelp();
});

program.parseAsync(preprocessArgv(process.argv)).catch((err: unknown) => {
  process.exitCode = reportCliError(err);
});
