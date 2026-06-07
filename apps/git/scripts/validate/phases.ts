import { fetchGitLog } from '../lib/git.js';
import {
  findConfiguredWeeksWithoutCommits,
  findUnconfiguredWeeks,
  loadPhaseConfig,
} from '../lib/phases.js';
import { parseGitLog, toExportCommit } from '../lib/parse.js';
import { verifyGitRepo } from '../lib/summary.js';

function main(): void {
  verifyGitRepo();

  const config = loadPhaseConfig();
  const raw = fetchGitLog();
  const commits = parseGitLog(raw).map(toExportCommit);

  const missing = findUnconfiguredWeeks(config, commits);
  const emptyConfigured = findConfiguredWeeksWithoutCommits(config, commits);

  if (missing.length > 0) {
    console.error('phases.config.json is missing week entries with commits:');
    for (const week of missing) {
      const count = commits.filter((commit) => commit.week === week).length;
      console.error(`  - ${week} (${count} commit${count === 1 ? '' : 's'})`);
    }
    console.error('');
    console.error('Add a curated phase block for each week in scripts/phases.config.json,');
    console.error('then run pnpm sync (or pnpm git:sync from repo root).');
    process.exit(1);
  }

  if (emptyConfigured.length > 0) {
    console.warn('phases.config.json entries with no commits (review or remove):');
    for (const week of emptyConfigured) {
      console.warn(`  - ${week}`);
    }
  }

  console.log(`phases.config.json covers all ${new Set(commits.map((c) => c.week)).size} active week(s).`);
}

main();
