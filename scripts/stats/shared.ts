import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export const SKIP_DIR_NAMES = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

export type StatsOptions = {
  tsOnly: boolean;
  root: string;
};

export type CollectedStats = {
  root: string;
  tsOnly: boolean;
  files: string[];
  totalLines: number;
};

export function parseStatsArgs(argv: string[]): StatsOptions {
  const args = argv.slice(2);
  let tsOnly = false;
  let root = process.cwd();

  for (const arg of args) {
    if (arg === '--ts') {
      tsOnly = true;
      continue;
    }
    if (!arg.startsWith('-')) {
      root = path.resolve(arg);
    }
  }

  return { tsOnly, root };
}

function isTsFile(name: string): boolean {
  return name.endsWith('.ts') || name.endsWith('.tsx');
}

export async function collectStats(options: StatsOptions): Promise<CollectedStats> {
  const files = await walkFiles(options.root, options.tsOnly);
  let totalLines = 0;

  for (const filePath of files) {
    totalLines += await countFileLines(filePath);
  }

  return {
    root: options.root,
    tsOnly: options.tsOnly,
    files,
    totalLines,
  };
}

async function walkFiles(root: string, tsOnly: boolean): Promise<string[]> {
  const files: string[] = [];

  async function visit(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIR_NAMES.has(entry.name)) continue;
        await visit(entryPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (tsOnly && !isTsFile(entry.name)) continue;
      files.push(entryPath);
    }
  }

  await visit(path.resolve(root));
  files.sort((a, b) => a.localeCompare(b));
  return files;
}

async function countFileLines(filePath: string): Promise<number> {
  try {
    const content = await readFile(filePath, 'utf8');
    return lineCount(content);
  } catch {
    return 0;
  }
}

function lineCount(content: string): number {
  if (content.length === 0) return 0;
  const newlines = content.match(/\n/g)?.length ?? 0;
  return content.endsWith('\n') ? newlines : newlines + 1;
}

export function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function filesLabel(tsOnly: boolean): string {
  return tsOnly ? 'Source files (.ts, .tsx)' : 'Source files';
}

export function linesLabel(tsOnly: boolean): string {
  return tsOnly ? 'Lines of code (.ts, .tsx)' : 'Lines of code';
}
