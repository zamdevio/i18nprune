import fs from 'node:fs';
import path from 'node:path';
import { fetchGitLog } from './lib/git.js';
import { mergePhases, loadPhaseConfig } from './lib/phases.js';
import { parseGitLog, toExportCommit } from './lib/parse.js';
import { DATA_DIR } from './lib/paths.js';
import { buildSummary, verifyGitRepo } from './lib/summary.js';

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function main(): void {
  verifyGitRepo();

  const raw = fetchGitLog();
  const parsed = parseGitLog(raw);
  const commits = parsed.map(toExportCommit);
  const summary = buildSummary(commits);
  const phases = mergePhases(loadPhaseConfig(), commits);

  writeJson(path.join(DATA_DIR, 'commits.json'), commits);
  writeJson(path.join(DATA_DIR, 'summary.json'), summary);
  writeJson(path.join(DATA_DIR, 'phases.json'), phases);

  console.log(`Synced ${commits.length} commits → src/data/commits.json`);
  console.log(
    `Summary: ${summary.totalCommits} commits, ${summary.authors} author(s), peak ${summary.topCommitDay.date} (${summary.topCommitDay.count})`,
  );
  console.log(`Phases: ${phases.length} week blocks → src/data/phases.json`);
}

main();
