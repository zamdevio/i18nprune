/**
 * Collects git + Vitest + GitHub (public REST API) facts and writes `src/data/site.ts`.
 * Run from repo: `pnpm --filter i18nprune-web run generate:data`
 * (or automatically before `vite build` via `prebuild`).
 */
import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_REPO_URL,
} from "../../../packages/cli/src/constants/links";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPS_WEB = join(__dirname, "..");
const REPO_ROOT = join(APPS_WEB, "../..");

const GITHUB_REF = { owner: GITHUB_OWNER, repo: GITHUB_REPO };

type VitestJson = {
  success?: boolean;
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  numPendingTests?: number;
  testResults?: { name: string }[];
  startTime?: number;
};

type GitHubRepo = {
  stargazers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  subscribers_count?: number;
};

function sh(cmd: string, cwd: string): string {
  return execSync(cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function workspaceProjectCount(): number {
  let n = 0;
  for (const root of ["packages", "apps"]) {
    const dir = join(REPO_ROOT, root);
    try {
      for (const name of readdirSync(dir, { withFileTypes: true })) {
        if (!name.isDirectory() || name.name.startsWith(".")) continue;
        try {
          readFileSync(join(dir, name.name, "package.json"), "utf8");
          n++;
        } catch {
          /* not a package */
        }
      }
    } catch {
      /* missing */
    }
  }
  return Math.max(n, 1);
}

function runVitestJson(): VitestJson | null {
  const outPath = join(APPS_WEB, ".vitest-report.json");
  try {
    execSync(`pnpm exec vitest run --reporter=json --outputFile="${outPath}"`, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    /* vitest may exit 1 on test failure — still try to read report */
  }
  try {
    const raw = readFileSync(outPath, "utf8");
    return JSON.parse(raw) as VitestJson;
  } catch {
    return null;
  }
}

async function fetchGitHubMeta(): Promise<{
  repo: GitHubRepo | null;
  contributors: number | null;
  error: string | null;
}> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "i18nprune-site-data-generator",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    const repoRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REF.owner}/${GITHUB_REF.repo}`,
      { headers },
    );
    if (!repoRes.ok) {
      return {
        repo: null,
        contributors: null,
        error: `GitHub repo HTTP ${repoRes.status}`,
      };
    }
    const repo = (await repoRes.json()) as GitHubRepo;

    let contributors: number | null = null;
    const cRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REF.owner}/${GITHUB_REF.repo}/contributors?per_page=100&anon=true`,
      { headers },
    );
    if (cRes.ok) {
      const arr = (await cRes.json()) as unknown[];
      contributors = Array.isArray(arr) ? arr.length : null;
    }

    return { repo, contributors, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { repo: null, contributors: null, error: msg };
  }
}

async function main() {
  const generatedAt = new Date().toISOString();

  let commitCount = 0;
  let headBranch = "main";
  const recentCommits: { shortHash: string; subject: string }[] = [];
  try {
    commitCount = parseInt(sh(`git rev-list --count HEAD`, REPO_ROOT), 10) || 0;
    headBranch = sh("git branch --show-current", REPO_ROOT) || "main";
    const logOut = sh(`git log -6 --format=%h%x09%s`, REPO_ROOT);
    for (const line of logOut.split("\n")) {
      const tab = line.indexOf("\t");
      if (tab === -1) continue;
      recentCommits.push({
        shortHash: line.slice(0, tab).trim(),
        subject: line.slice(tab + 1).trim(),
      });
    }
  } catch (e) {
    console.warn("[generate-site-data] git:", e);
  }

  const vitest = runVitestJson();
  const testFiles = vitest?.testResults?.length ?? 0;
  const totalTests = vitest?.numTotalTests ?? 0;
  const passedTests = vitest?.numPassedTests ?? 0;
  const failedTests = vitest?.numFailedTests ?? 0;
  const testsAllPassed = Boolean(
    vitest && vitest.success === true && (vitest.numFailedTests ?? 0) === 0,
  );

  const workspacePackages = workspaceProjectCount();

  const gh = await fetchGitHubMeta();

  const data = {
    generatedAt,
    gitHub: {
      owner: GITHUB_REF.owner,
      repo: GITHUB_REF.repo,
      cloneUrlHttps: `${GITHUB_REPO_URL}.git`,
      stars: gh.repo?.stargazers_count ?? null,
      forks: gh.repo?.forks_count ?? null,
      openIssues: gh.repo?.open_issues_count ?? null,
      watchers: gh.repo?.subscribers_count ?? null,
      contributors: gh.contributors,
      apiError: gh.error,
    },
    git: {
      commitCount,
      headBranch,
      recentCommits,
    },
    tests: vitest
      ? {
          allPassed: Boolean(testsAllPassed),
          success: Boolean(vitest.success),
          testFiles,
          totalTests,
          passedTests,
          failedTests,
          pendingTests: vitest.numPendingTests ?? 0,
        }
      : null,
    workspace: {
      pnpmWorkspaceProjects: workspacePackages,
    },
  };

  const dataDir = join(APPS_WEB, "src/data");
  mkdirSync(dataDir, { recursive: true });
  const outFile = join(dataDir, "site.ts");
  const body = `/* eslint-disable */
// AUTO-GENERATED by apps/web/scripts/generate-site-data.ts — do not edit by hand.
// Regenerate: pnpm --filter i18nprune-web run generate:data

export const SITE_DATA = ${JSON.stringify(data, null, 2)} as const;

export type SiteData = typeof SITE_DATA;
`;
  writeFileSync(outFile, body, "utf8");
  console.log(`[generate-site-data] wrote ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
