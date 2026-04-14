import { LINKS } from "../constants/links";
import {
  GITHUB_OWNER,
  GITHUB_REPO,
} from "../../../../packages/cli/src/constants/links";

export type GitHubRepoMeta = {
  stars: number | null;
  forks: number | null;
  openIssues: number | null;
  watchers: number | null;
  contributors: number | null;
  apiError: string | null;
  fetchedAtUnix?: number;
  expiresAtUnix?: number;
  nextRefreshUnix?: number;
  source?: "cache" | "live" | "stale-cache";
  stale?: boolean;
};

function normalizeGithubUrl(url: string): string {
  return url.replace(/\.git$/, "").replace(/\/+$/, "");
}

export function githubCloneUrl(url: string = LINKS.github): string {
  return `${normalizeGithubUrl(url)}.git`;
}

export function formatGithubCount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-";
  return value.toLocaleString("en-US");
}

export async function fetchGithub(): Promise<GitHubRepoMeta> {
  const workerUrl = `${LINKS.githubApi}/metadata`;
  try {
    const workerRes = await fetch(workerUrl, {
      headers: { Accept: "application/json" },
    });
    if (workerRes.ok) {
      const json = (await workerRes.json()) as {
        data?: {
          stars?: number | null;
          forks?: number | null;
          openIssues?: number | null;
          watchers?: number | null;
          contributors?: number | null;
          apiError?: string | null;
        };
        fetchedAtUnix?: number;
        expiresAtUnix?: number;
        nextRefreshUnix?: number;
        source?: "cache" | "live" | "stale-cache";
        stale?: boolean;
      };
      if (json.data) {
        return {
          stars: json.data.stars ?? null,
          forks: json.data.forks ?? null,
          openIssues: json.data.openIssues ?? null,
          watchers: json.data.watchers ?? null,
          contributors: json.data.contributors ?? null,
          apiError: json.data.apiError ?? null,
          fetchedAtUnix: json.fetchedAtUnix,
          expiresAtUnix: json.expiresAtUnix,
          nextRefreshUnix: json.nextRefreshUnix,
          source: json.source,
          stale: json.stale,
        };
      }
    }
  } catch {
    // fall through to direct GitHub API
  }

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "i18nprune-web",
  };
  try {
    const repoRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, { headers });
    if (!repoRes.ok) {
      return {
        stars: null,
        forks: null,
        openIssues: null,
        watchers: null,
        contributors: null,
        apiError: `GitHub repo HTTP ${repoRes.status}`,
      };
    }
    const repoJson = (await repoRes.json()) as {
      stargazers_count?: unknown;
      forks_count?: unknown;
      open_issues_count?: unknown;
      subscribers_count?: unknown;
    };
    const contributorsRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contributors?per_page=100&anon=true`,
      { headers },
    );
    let contributors: number | null = null;
    if (contributorsRes.ok) {
      const arr = (await contributorsRes.json()) as unknown;
      contributors = Array.isArray(arr) ? arr.length : null;
    }
    return {
      stars: typeof repoJson.stargazers_count === "number" ? repoJson.stargazers_count : null,
      forks: typeof repoJson.forks_count === "number" ? repoJson.forks_count : null,
      openIssues: typeof repoJson.open_issues_count === "number" ? repoJson.open_issues_count : null,
      watchers: typeof repoJson.subscribers_count === "number" ? repoJson.subscribers_count : null,
      contributors,
      apiError: null,
    };
  } catch (e) {
    return {
      stars: null,
      forks: null,
      openIssues: null,
      watchers: null,
      contributors: null,
      apiError: e instanceof Error ? e.message : String(e),
    };
  }
}
