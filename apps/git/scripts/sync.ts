import fs from 'node:fs';
import path from 'node:path';
import { buildAuthorsWithGitHub } from './lib/authors.js';
import { buildBranches, buildCommitBranchMap } from './lib/branches.js';
import { fetchGitLog, tryGit } from './lib/git.js';
import { mergePhases, loadPhaseConfig } from './lib/phases.js';
import { parseGitLog, toExportCommit } from './lib/parse.js';
import { DATA_DIR } from './lib/paths.js';
import { buildSummary, verifyGitRepo } from './lib/summary.js';
import { annotateCommitRefs, buildCommitTagMap, buildTags } from './lib/tags.js';

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function main(): Promise<void> {
  verifyGitRepo();

  const raw = fetchGitLog();
  const parsed = parseGitLog(raw);
  const baseCommits = parsed.map(toExportCommit);
  const tags = buildTags();
  const tagMap = buildCommitTagMap(tags);
  const branchMap = buildCommitBranchMap(
    tryGit(['branch', '--list', '--format=%(refname:short)'])?.split('\n').filter(Boolean) ?? [],
  );
  const commits = annotateCommitRefs(baseCommits, tagMap, branchMap);
  const summary = buildSummary(commits);
  const phases = mergePhases(loadPhaseConfig(), commits);
  const authors = await buildAuthorsWithGitHub(commits);
  const branches = buildBranches(commits);

  writeJson(path.join(DATA_DIR, 'commits.json'), commits);
  writeJson(path.join(DATA_DIR, 'summary.json'), summary);
  writeJson(path.join(DATA_DIR, 'phases.json'), phases);
  writeJson(path.join(DATA_DIR, 'authors.json'), authors);
  writeJson(path.join(DATA_DIR, 'tags.json'), tags);
  writeJson(path.join(DATA_DIR, 'branches.json'), branches);

  console.log(`Synced ${commits.length} commits → src/data/commits.json`);
  console.log(
    `Summary: ${summary.totalCommits} commits, ${summary.authors} author(s), peak ${summary.topCommitDay.date} (${summary.topCommitDay.count})`,
  );
  console.log(`Phases: ${phases.length} week blocks → src/data/phases.json`);
  console.log(`Authors: ${authors.length} → src/data/authors.json`);
  console.log(`Tags: ${tags.length} → src/data/tags.json`);
  console.log(`Branches: ${branches.length} → src/data/branches.json`);
  console.log(`Synced at: ${summary.syncedAt}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
