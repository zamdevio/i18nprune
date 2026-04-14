import { GITHUB_OWNER, GITHUB_REPO } from "../../../../../packages/cli/src/constants/links";
import type { CachedGitHubPayload, GitHubRepoPayload, WorkerEnv } from "../types";

const TTL_SECONDS = 120;

type CacheRecord = {
  fetchedAtUnix: number;
  expiresAtUnix: number;
  data: GitHubRepoPayload;
};

function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    ...init,
  });
}

async function fetchGitHub(owner: string, repo: string, token?: string): Promise<GitHubRepoPayload> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "i18nprune-github-worker",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      return {
        owner,
        repo,
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

    let contributors: number | null = null;
    const contributorsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100&anon=true`,
      { headers },
    );
    if (contributorsRes.ok) {
      const arr = (await contributorsRes.json()) as unknown;
      contributors = Array.isArray(arr) ? arr.length : null;
    }

    return {
      owner,
      repo,
      stars: typeof repoJson.stargazers_count === "number" ? repoJson.stargazers_count : null,
      forks: typeof repoJson.forks_count === "number" ? repoJson.forks_count : null,
      openIssues: typeof repoJson.open_issues_count === "number" ? repoJson.open_issues_count : null,
      watchers: typeof repoJson.subscribers_count === "number" ? repoJson.subscribers_count : null,
      contributors,
      apiError: null,
    };
  } catch (error) {
    return {
      owner,
      repo,
      stars: null,
      forks: null,
      openIssues: null,
      watchers: null,
      contributors: null,
      apiError: error instanceof Error ? error.message : String(error),
    };
  }
}

export class GitHubCacheDO {
  private readonly state: DurableObjectState;
  private readonly env: WorkerEnv;

  constructor(state: DurableObjectState, env: WorkerEnv) {
    this.state = state;
    this.env = env;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return json({ ok: true, durableObject: true, nowUnix: nowUnix() });
    }

    const force = url.searchParams.get("force") === "1";
    const owner = GITHUB_OWNER;
    const repo = GITHUB_REPO;
    const key = `${owner}/${repo}`;
    const record = await this.state.storage.get<CacheRecord>(key);
    const now = nowUnix();

    if (!force && record && record.expiresAtUnix > now) {
      return json({
        ok: true,
        source: "cache",
        stale: false,
        fetchedAtUnix: record.fetchedAtUnix,
        expiresAtUnix: record.expiresAtUnix,
        nextRefreshUnix: record.expiresAtUnix,
        data: record.data,
      } satisfies CachedGitHubPayload);
    }

    const live = await fetchGitHub(owner, repo, this.env.GITHUB_TOKEN);
    const fetchedAtUnix = now;
    const expiresAtUnix = now + TTL_SECONDS;

    if (live.apiError && record) {
      return json({
        ok: true,
        source: "stale-cache",
        stale: true,
        fetchedAtUnix: record.fetchedAtUnix,
        expiresAtUnix: record.expiresAtUnix,
        nextRefreshUnix: now + TTL_SECONDS,
        data: record.data,
      } satisfies CachedGitHubPayload);
    }

    const nextRecord: CacheRecord = {
      fetchedAtUnix,
      expiresAtUnix,
      data: live,
    };
    await this.state.storage.put(key, nextRecord);

    return json({
      ok: true,
      source: "live",
      stale: false,
      fetchedAtUnix,
      expiresAtUnix,
      nextRefreshUnix: expiresAtUnix,
      data: live,
    } satisfies CachedGitHubPayload);
  }
}
