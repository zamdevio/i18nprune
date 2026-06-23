import chalk from 'chalk';
import {
  collectStats,
  filesLabel,
  formatInteger,
  linesLabel,
  parseStatsArgs,
} from './shared.js';

function printHelp(): void {
  console.log(`Usage: pnpm stats [--ts] [root]

Print file and line counts (skips node_modules, .git, dist, build, coverage).

Flags:
  --ts   Count only .ts and .tsx files (default: all files)
  -h     Show help
`);
}

export async function runStats(argv: string[]): Promise<void> {
  if (argv.includes('-h') || argv.includes('--help')) {
    printHelp();
    return;
  }

  const options = parseStatsArgs(argv);
  const stats = await collectStats(options);
  const fileCount = stats.files.length;
  const avg =
    fileCount > 0 ? Math.round(stats.totalLines / fileCount) : 0;

  console.log(chalk.bold('Repository stats'));
  if (options.tsOnly) {
    console.log(chalk.dim('  scope: TypeScript (.ts, .tsx)'));
  } else {
    console.log(chalk.dim('  scope: all files'));
  }
  console.log('');

  console.log(
    `${chalk.bold(filesLabel(options.tsOnly))}: ${chalk.cyan(formatInteger(fileCount))} files`,
  );
  console.log(
    `${chalk.bold(linesLabel(options.tsOnly))}: ${chalk.cyan(formatInteger(stats.totalLines))} lines`,
  );
  if (fileCount > 0) {
    console.log(chalk.dim(`  avg ${formatInteger(avg)} lines/file`));
  }
}

runStats(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`stats: ${message}`));
  process.exitCode = 1;
});
