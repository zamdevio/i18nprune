import chalk from 'chalk';
import {
  collectStats,
  filesLabel,
  formatInteger,
  parseStatsArgs,
} from './shared.js';

function printHelp(): void {
  console.log(`Usage: pnpm files [--ts] [root]

Count repository files (skips node_modules, .git, dist, build, coverage).

Flags:
  --ts   Count only .ts and .tsx files (default: all files)
  -h     Show help (via pnpm — pass after -- if needed)
`);
}

export async function runFiles(argv: string[]): Promise<void> {
  if (argv.includes('-h') || argv.includes('--help')) {
    printHelp();
    return;
  }

  const options = parseStatsArgs(argv);
  const stats = await collectStats(options);
  const label = filesLabel(options.tsOnly);

  console.log(`${chalk.bold(label)}: ${chalk.cyan(formatInteger(stats.files.length))} files`);
}

runFiles(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`files: ${message}`));
  process.exitCode = 1;
});
