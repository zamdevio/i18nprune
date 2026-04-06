#!/usr/bin/env node

import { Command } from 'commander';
import { preprocessArgv } from '@/argv/index.js';
import { ensureConfig } from '@/config/init/index.js';
import { ensureConfigPathResolved, setConfigPath } from '@/config/resolve/index.js';
import {
  clearContextCache,
  resetRunOptions,
  setCliGlobalOverrides,
  resetCliGlobals,
  setRunOptions,
} from '@/core/context/index.js';
import { setCliYesFlag, getCliYesFlag, setArgvJsonFlag } from '@/core/context/globals.js';
import { reportCliError } from '@/core/errors/index.js';
import { generate } from '@/commands/generate/index.js';
import { fill } from '@/commands/fill/index.js';
import { sync } from '@/commands/sync/index.js';
import { validate } from '@/commands/validate/index.js';
import { quality } from '@/commands/quality/index.js';
import { cleanup } from '@/commands/cleanup/index.js';
import { runLanguagesCommand } from '@/commands/languages/index.js';
import { runConfigCommand } from '@/commands/config/index.js';
import { runReviewCommand } from '@/commands/review/index.js';
import { runDoctorCommand } from '@/commands/doctor/index.js';
import { runLocalesList, runLocalesEdit, runLocalesDynamic, runLocalesDelete } from '@/commands/locales/index.js';
import { runReportHelpTopic } from '@/commands/report/index.js';
import { configureCliHelp } from '@/commands/help/index.js';
import { CLI_ROOT_DESCRIPTION } from '@/constants/cli.js';
import { maybePrintCommandBanner } from '@/utils/cli/banner.js';
import { getCommandInvocationPath } from '@/utils/cli/path.js';
import { COMMANDS_WITH_JSON_OUTPUT } from '@/constants/jsonoutput.js';
import { resetReportCliOptions, setReportCliOptions } from '@/core/context/report.js';
import { resetReportSession } from '@/utils/report/session.js';
import type { ReportFormat } from '@/utils/report/types.js';

function parseReportFormat(s: string | undefined): ReportFormat | undefined {
  if (!s) return undefined;
  const x = s.trim().toLowerCase();
  if (x === 'json' || x === 'text' || x === 'csv') return x;
  return undefined;
}

const program = new Command();
configureCliHelp(program);

program
  .name('i18nprune')
  .description(CLI_ROOT_DESCRIPTION)
  .version('0.1.0', '-v, --version', 'print version and exit')
  .option('--config <path>', 'path to i18nprune.config (.ts, .mts, .js, .mjs — not JSON)')
  .option('--yes', 'if no config file exists, write defaults without prompting', false)
  .option(
    '--json',
    'machine-readable output (only commands that support it; e.g. config, validate, doctor — ignored for init/help)',
    false,
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
  .option('--no-discovery', 'disable heuristic path discovery', false)
  .option(
    '--report-file <path>',
    'write structured run report at end (supported commands: sync, fill, cleanup, …)',
    undefined,
  )
  .option('--report-format <format>', 'report artifact format: json, text, or csv', undefined)
  .hook('preAction', async (_thisCommand, actionCommand) => {
    const opts = program.opts<{
      config?: string;
      yes?: boolean;
      source?: string;
      localesDir?: string;
      src?: string;
      functions?: string;
      noDiscovery?: boolean;
      json?: boolean;
      quiet?: boolean;
      silent?: boolean;
      reportFile?: string;
      reportFormat?: string;
    }>();
    setConfigPath(opts.config);
    clearContextCache();
    resetRunOptions();
    resetReportCliOptions();
    resetReportSession();
    resetCliGlobals();
    setArgvJsonFlag(Boolean(opts.json));
    await ensureConfigPathResolved();
    const silent = Boolean(opts.silent);
    const quiet = Boolean(opts.quiet) || silent;
    const cmdName = actionCommand.name();
    const jsonOutput =
      Boolean(opts.json) && COMMANDS_WITH_JSON_OUTPUT.has(cmdName);
    setRunOptions({
      json: jsonOutput,
      quiet,
      silent,
    });
    setCliGlobalOverrides({
      ...(opts.source !== undefined ? { source: opts.source } : {}),
      ...(opts.localesDir !== undefined ? { localesDir: opts.localesDir } : {}),
      ...(opts.src !== undefined ? { src: opts.src } : {}),
      ...(opts.functions !== undefined ? { functions: opts.functions } : {}),
      ...(opts.noDiscovery ? { noDiscovery: true } : {}),
    });
    setCliYesFlag(Boolean(opts.yes));
    setReportCliOptions(opts.reportFile, parseReportFormat(opts.reportFormat));
    maybePrintCommandBanner(actionCommand);
    const inv = getCommandInvocationPath(actionCommand, 'i18nprune');
    const skipEnsureConfig = ['languages', 'help', 'init', 'config', 'review', 'doctor'].includes(
      actionCommand.name(),
    );
    if (!skipEnsureConfig) {
      const silentIfExists =
        inv === 'locales' ||
        inv === 'locales list' ||
        inv === 'locales edit' ||
        inv === 'generate' ||
        inv === 'sync' ||
        inv === 'fill' ||
        inv === 'doctor' ||
        inv === 'validate' ||
        inv === 'quality' ||
        inv === 'review' ||
        inv === 'cleanup' ||
        inv === 'report' ||
        inv === 'locales dynamic' ||
        inv === 'locales delete';
      await ensureConfig({ yes: Boolean(opts.yes), silentIfExists });
    }
  });

program
  .command('init')
  .description('Create i18nprune.config.ts (or .mts / .js) when missing — interactive unless --yes')
  .action(async () => {
    await ensureConfig({ yes: getCliYesFlag() });
  });

program
  .command('config')
  .description('Show resolved config, paths, and I18NPRUNE_* env snapshot (use global --json)')
  .action(async () => {
    await runConfigCommand();
  });

program
  .command('validate')
  .description('Literal translation keys in code exist in source JSON')
  .action(async () => {
    await validate({});
  });

program
  .command('sync')
  .description('Align locale file shapes to the source (merge + prune; honors policies.preserve)')
  .option('--dry-run', 'show targets only; do not write files', false)
  .option(
    '--lang <codes>',
    'comma-separated locale basenames, or "all" (default: all non-source locales under localesDir)',
  )
  .action(async (opts: { dryRun?: boolean; lang?: string }) => {
    await sync({ dryRun: Boolean(opts.dryRun), lang: opts.lang });
  });

program
  .command('generate')
  .description(
    'Generate a target locale JSON from the source (nested shape preserved; string leaves translated)',
  )
  .option('--source <path>', 'source JSON path (defaults to resolved config / context)')
  .option('--lang <code>', 'target BCP47-style code (e.g. ja, pt-br); prompts in a TTY if omitted')
  .option(
    '--english-name <name>',
    'English label in <lang>.meta.json (default: catalog for --lang)',
  )
  .option(
    '--native-name <name>',
    'Native endonym in <lang>.meta.json (default: catalog for --lang)',
  )
  .option('--direction <ltr|rtl>', 'layout direction for .meta.json (default ltr)')
  .option(
    '--no-meta',
    'do not write <lang>.meta.json; skip English/native/direction prompts and related env',
    false,
  )
  .option('--force', 're-translate even if target already has every source string path', false)
  .option('--dry-run', 'do not call translator or write files', false)
  .action(
    async (opts: {
      source?: string;
      lang?: string;
      englishName?: string;
      nativeName?: string;
      direction?: string;
      noMeta?: boolean;
      force?: boolean;
      dryRun?: boolean;
    }) => {
      const direction =
        opts.direction === 'ltr' || opts.direction === 'rtl' ? opts.direction : undefined;
      await generate({
        source: opts.source,
        lang: opts.lang,
        englishName: opts.englishName,
        nativeName: opts.nativeName,
        direction,
        noMeta: opts.noMeta === true ? true : undefined,
        force: opts.force === true ? true : undefined,
        dryRun: Boolean(opts.dryRun),
      });
    },
  );

program
  .command('fill')
  .description('Re-translate strings that still match the source language')
  .option(
    '--lang <codes>',
    'one locale, comma-separated list, or "all" (non-interactive: required)',
  )
  .option(
    '--no-meta',
    'do not write <lang>.meta.json (default: create/update sidecar from catalog)',
    false,
  )
  .option('--dry-run', 'list counts only; no API calls or writes', false)
  .action(async (opts: { lang?: string; dryRun?: boolean; noMeta?: boolean }) => {
    await fill({
      lang: opts.lang,
      dryRun: Boolean(opts.dryRun),
      noMeta: opts.noMeta === true ? true : undefined,
    });
  });

program
  .command('quality')
  .description('Parity / English-identical / drift (uses config policies when implemented)')
  .option('--lang <code>', 'only this locale file (basename)')
  .action(async (opts: { lang?: string }) => {
    await quality({ lang: opts.lang });
  });

program
  .command('review')
  .description('Locale review vs source (paths + English-identical counts; use global --json)')
  .option('--lang <code>', 'only this locale basename')
  .action(async (opts: { lang?: string }) => {
    await runReviewCommand({ lang: opts.lang });
  });

program
  .command('cleanup')
  .description('Remove unused keys (optional ripgrep safety on src/)')
  .option('--check-only', 'report only, no writes', false)
  .option('--skip-rg', 'do not run ripgrep (static unused-key list only)', false)
  .action(async (opts: { checkOnly?: boolean; skipRg?: boolean }) => {
    await cleanup({ checkOnly: Boolean(opts.checkOnly), skipRg: Boolean(opts.skipRg) });
  });

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
    await runLanguagesCommand({
      filter: opts.filter,
      table: opts.table === true ? true : undefined,
    });
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
    await runLocalesList();
  });

localesCmd
  .command('edit')
  .description(
    'Edit an existing locale JSON and your app i18n loader wiring. Future: safe auto-patches for supported loader patterns.',
  )
  .option('--lang <code>', 'locale basename (e.g. ja) — must match a *.json in localesDir; prompts if omitted in a TTY')
  .action(async (opts: { lang?: string }) => {
    await runLocalesEdit({ lang: opts.lang });
  });

localesCmd
  .command('dynamic')
  .description(
    'List heuristic non-literal translation key sites under src (read-only; no locale writes)',
  )
  .action(async () => {
    await runLocalesDynamic();
  });

localesCmd
  .command('delete')
  .description(
    'Delete a target locale JSON (and .meta.json if present); future: loader auto-patches',
  )
  .option('--lang <code>', 'locale basename to delete (required)')
  .action(async (opts: { lang?: string }) => {
    await runLocalesDelete({ lang: opts.lang });
  });

program
  .command('report')
  .description(
    'Help for global --report-file / --report-format (structured run artifacts; see docs)',
  )
  .action(async () => {
    await runReportHelpTopic();
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
    await runDoctorCommand({ only: opts.only, strict: opts.strict === true });
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

program.parseAsync(preprocessArgv(process.argv)).catch((err: unknown) => {
  process.exitCode = reportCliError(err);
});
