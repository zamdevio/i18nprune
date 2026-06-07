import path from 'node:path';
import { buildAuthorsWithGitHub } from './lib/authors.js';
import { buildBranches, buildCommitBranchMap } from './lib/branches.js';
import { formatGitHubEnrichmentSummary } from './lib/github/api.js';
import { GitHubProfileCache } from './lib/github/cache.js';
import { fetchGitLog, tryGit } from './lib/git.js';
import { mergePhases, loadPhaseConfig } from './lib/phases.js';
import { parseGitLog, toExportCommit } from './lib/parse.js';
import { DATA_DIR } from './lib/paths.js';
import { buildSummary, verifyGitRepo } from './lib/summary.js';
import { annotateCommitRefs, buildCommitTagMap, buildTags } from './lib/tags.js';
import {
  computeGitFingerprint,
  saveSyncState,
  shouldSkipSync,
  SYNC_OUTPUT_FILES,
} from './lib/sync-state.js';
import { writeJsonIfChanged } from './lib/write.js';

function parseForceFlag(argv: string[]): boolean {
  return argv.includes('--force');
}

async function main(): Promise<void> {
  const force = parseForceFlag(process.argv);
  const started = performance.now();
  verifyGitRepo();

  const fingerprint = computeGitFingerprint();
  const priorSync = shouldSkipSync(force, fingerprint);
  if (priorSync) {
    const head = fingerprint.headSha.slice(0, 7);
    console.log(`Sync skipped (no git changes since ${priorSync.syncedAt}, HEAD ${head})`);
    console.log('Use --force to rebuild.');
    return;
  }

  if (force) {
    GitHubProfileCache.clearFile();
  }

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
  const githubCache = GitHubProfileCache.load();
  const { authors, summary: githubSummary } = await buildAuthorsWithGitHub(commits, {
    forceRefresh: force,
    cache: githubCache,
  });
  const githubMs = performance.now() - githubStart;

  const branches = buildBranches(commits);

  const writeStart = performance.now();
  let writes = 0;
  const outputs: Record<string, unknown> = {
    'commits.json': commits,
    'summary.json': summary,
    'phases.json': phases,
    'authors.json': authors,
    'tags.json': tags,
    'branches.json': branches,
  };
  for (const name of SYNC_OUTPUT_FILES) {
    if (writeJsonIfChanged(path.join(DATA_DIR, name), outputs[name])) writes += 1;
  }
  const writeMs = performance.now() - writeStart;

  saveSyncState(fingerprint);

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
  console.log(`Data writes: ${writes}/${SYNC_OUTPUT_FILES.length} file(s) changed`);
  console.log(
    `Timing: parse ${parseMs.toFixed(0)}ms · github ${githubMs.toFixed(0)}ms · write ${writeMs.toFixed(0)}ms · total ${(performance.now() - started).toFixed(0)}ms`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
