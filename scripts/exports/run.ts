import path from 'node:path';

import {
  runExportsDiff,
  runExportsGraph,
  runExportsInventory,
  runExportsTimeline,
  runExportsTrend,
  runExportsValidate,
} from './commands/index.js';
import { ExportError, isExportError } from './errors/index.js';
import { printHelp, printHelpHint, type HelpTopic } from './help/index.js';
import { printExportError, printUnexpected } from './logger/index.js';

const COMMANDS = ['inventory', 'diff', 'validate', 'trend', 'timeline', 'graph', 'help'] as const;
type Command = (typeof COMMANDS)[number];

function isCommand(value: string): value is Command {
  return (COMMANDS as readonly string[]).includes(value);
}

function normalizeCommand(raw: string): Command | null {
  const name = raw.replace(/^exports:/, '');
  return isCommand(name) ? name : null;
}

function flagHint(command: Command): string {
  switch (command) {
    case 'validate':
      return 'Flags: -v, --verbose, --since=<ref>, -h, --help';
    case 'trend':
      return 'Flags: --tags=<n>, -v, --verbose, -f, --force, --no-cache, -h, --help';
    case 'timeline':
      return 'Flags: --limit=<n>, -v, --verbose, -f, --force, --no-cache, -h, --help';
    default:
      return 'Flags: -v, --verbose, -f, --force, --no-cache, -h, --help';
  }
}

function parseArgs(argv: string[]): {
  command: Command;
  positional: string[];
  verbose: boolean;
  noCache: boolean;
  force: boolean;
  since?: string;
  tagLimit?: number;
  commitLimit?: number;
  helpTopic: HelpTopic | null;
} {
  const [, , commandRaw, ...rest] = argv;

  if (!commandRaw || commandRaw === '--help' || commandRaw === '-h' || commandRaw === 'help') {
    return {
      command: 'help',
      positional: [],
      verbose: false,
      noCache: false,
      force: false,
      helpTopic: 'all',
    };
  }

  const command = normalizeCommand(commandRaw);
  if (!command) {
    throw new ExportError(`Unknown command "${commandRaw}"`, 'usage', {
      exitCode: 2,
      details: {
        suggestion: `Expected one of: ${COMMANDS.filter((c) => c !== 'help').join(', ')}`,
      },
    });
  }
  
  let verbose = false;
  let noCache = false;
  let force = false;
  let since: string | undefined;
  let tagLimit: number | undefined;
  let commitLimit: number | undefined;
  let helpTopic: HelpTopic | null = null;
  const positional: string[] = [];

  for (const arg of rest) {
    if (arg === '--verbose' || arg === '-v') verbose = true;
    else if (arg === '--no-cache') noCache = true;
    else if (arg === '--force' || arg === '-f') force = true;
    else if (arg.startsWith('--since=')) since = arg.slice('--since='.length);
    else if (arg.startsWith('--tags=')) tagLimit = Number(arg.slice('--tags='.length));
    else if (arg.startsWith('--limit=')) commitLimit = Number(arg.slice('--limit='.length));
    else if (arg === '--help' || arg === '-h') helpTopic = command === 'help' ? 'all' : command;
    else if (arg.startsWith('-')) {
      throw new ExportError(`Unknown flag "${arg}" for exports:${command}`, 'usage', {
        exitCode: 2,
        details: { command, suggestion: flagHint(command) },
      });
    } else positional.push(arg);
  }

  if (noCache && force) {
    throw new ExportError('Cannot combine --no-cache with --force', 'usage', {
      exitCode: 2,
      details: {
        command,
        suggestion: 'Use --force to rebuild and overwrite cache, or --no-cache to skip cache entirely.',
      },
    });
  }

  return { command, positional, verbose, noCache, force, since, tagLimit, commitLimit, helpTopic };
}

function main(): void {
  try {
    const { command, positional, verbose, noCache, force, since, tagLimit, commitLimit, helpTopic } = parseArgs(
      process.argv,
    );

    if (helpTopic) {
      printHelp(helpTopic);
      process.exit(0);
    }

    if (command === 'inventory') {
      runExportsInventory({ ref: positional[0], verbose, noCache, force });
      return;
    }

    if (command === 'diff') {
      runExportsDiff({ range: positional[0], noCache, force, verbose });
      return;
    }

    if (command === 'trend') {
      const limit = tagLimit ?? (positional[0] ? Number(positional[0]) : undefined);
      runExportsTrend({ tagLimit: limit && !Number.isNaN(limit) ? limit : 12, noCache, force, verbose });
      return;
    }

    if (command === 'timeline') {
      const timelineLimit =
        commitLimit !== undefined && !Number.isNaN(commitLimit) ? commitLimit : 20;
      runExportsTimeline({
        range: positional[0],
        limit: timelineLimit,
        noCache,
        force,
        verbose,
      });
      return;
    }

    if (command === 'graph') {
      runExportsGraph({ ref: positional[0], noCache, force, verbose });
      return;
    }

    if (command === 'validate') {
      const code = runExportsValidate({ since, verbose });
      process.exit(code);
    }

    printHelp('all');
  } catch (err) {
    if (isExportError(err)) {
      if (err.code === 'usage') {
        if (err.exitCode !== 0) printExportError(err);
        printHelp('all');
        printHelpHint(typeof err.details.command === 'string' ? err.details.command : undefined);
        process.exit(err.exitCode);
      }
      printExportError(err);
      printHelpHint();
      process.exit(err.exitCode);
    }
    printUnexpected(err);
    process.exit(1);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const thisFile = path.resolve(new URL(import.meta.url).pathname);

if (invokedPath === thisFile) {
  main();
}
