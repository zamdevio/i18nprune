import chalk from 'chalk';
import {
  collectStats,
  formatInteger,
  linesLabel,
  parseStatsArgs,
} from './shared.js';

function printHelp(): void {
  console.log(`Usage: pnpm lines [--ts] [root]

Count lines in repository files (skips node_modules, .git, dist, build, coverage).

Flags:
  --ts   Count only .ts and .tsx files (default: all files)
  -h     Show help
`);
}

export async function runLines(argv: string[]): Promise<void> {
  if (argv.includes('-h') || argv.includes('--help')) {
    printHelp();
    return;
  }

  const options = parseStatsArgs(argv);
  const stats = await collectStats(options);
  const label = linesLabel(options.tsOnly);
  const fileCount = stats.files.length;
  const avg =
    fileCount > 0 ? Math.round(stats.totalLines / fileCount) : 0;

  console.log(
    `${chalk.bold(label)}: ${chalk.cyan(formatInteger(stats.totalLines))} lines`,
  );
  if (fileCount > 0) {
    console.log(chalk.dim(`  avg ${formatInteger(avg)} lines/file`));
  }
}

runLines(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`lines: ${message}`));
  process.exitCode = 1;
});
