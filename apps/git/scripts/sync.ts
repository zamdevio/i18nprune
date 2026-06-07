import fs from 'node:fs';
import path from 'node:path';
import { buildAuthorsWithGitHub } from './lib/authors.js';
import { buildBranches, buildCommitBranchMap } from './lib/branches.js';
import { fetchGitLog, tryGit } from './lib/git.js';
import { formatGitHubEnrichmentSummary } from './lib/github-api.js';
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
  const started = performance.now();
  verifyGitRepo();

  const parseStart = performance.now();
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
  const parseMs = performance.now() - parseStart;

  const githubStart = performance.now();
  const { authors, summary: githubSummary } = await buildAuthorsWithGitHub(commits);
  const githubMs = performance.now() - githubStart;

  const branches = buildBranches(commits);

  const writeStart = performance.now();
  writeJson(path.join(DATA_DIR, 'commits.json'), commits);
  writeJson(path.join(DATA_DIR, 'summary.json'), summary);
  writeJson(path.join(DATA_DIR, 'phases.json'), phases);
  writeJson(path.join(DATA_DIR, 'authors.json'), authors);
  writeJson(path.join(DATA_DIR, 'tags.json'), tags);
  writeJson(path.join(DATA_DIR, 'branches.json'), branches);
  const writeMs = performance.now() - writeStart;

  console.log(`Synced ${commits.length} commits → src/data/commits.json`);
  console.log(
    `Summary: ${summary.totalCommits} commits, ${summary.authors} author(s), peak ${summary.topCommitDay.date} (${summary.topCommitDay.count})`,
  );
  console.log(`Phases: ${phases.length} week blocks → src/data/phases.json`);
  console.log(`Authors: ${authors.length} → src/data/authors.json`);
  console.log(
    `GitHub profiles: ${formatGitHubEnrichmentSummary(githubSummary)}${process.env.GITHUB_TOKEN ? '' : ' (set GITHUB_TOKEN for higher rate limits)'}`,
  );
  console.log(`Tags: ${tags.length} → src/data/tags.json`);
  console.log(`Branches: ${branches.length} → src/data/branches.json`);
  console.log(`Synced at: ${summary.syncedAt}`);
  console.log(
    `Timing: parse ${parseMs.toFixed(0)}ms · github ${githubMs.toFixed(0)}ms · write ${writeMs.toFixed(0)}ms · total ${(performance.now() - started).toFixed(0)}ms`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
