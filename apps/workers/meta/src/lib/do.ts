import { GITHUB_OWNER, GITHUB_REPO } from "../constants/github";
import { fetchNpmBundle } from "./npm";
import type {
  CachedGitHubPayload,
  CachedNpmPayload,
  GitHubRepoPayload,
  NpmBundleCacheEnvelope,
  NpmBundlePayload,
  WorkerEnv,
} from "../types";

const GITHUB_TTL_SECONDS = 120;
const NPM_TTL_SECONDS = 600;
const NPM_BUNDLE_STORAGE_KEY = "npm:bundle:v1";

type GitHubCacheRecord = {
  fetchedAtUnix: number;
  expiresAtUnix: number;
  data: GitHubRepoPayload;
};

type NpmCacheRecord = {
  fetchedAtUnix: number;
  expiresAtUnix: number;
  data: NpmBundlePayload;
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
    "User-Agent": "i18nprune-meta-worker",
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

function isNpmPath(pathname: string): boolean {
  return pathname === "/npm" || pathname.startsWith("/npm/");
}

export class MetaCacheDO {
  private readonly state: DurableObjectState;
  private readonly env: WorkerEnv;

  constructor(state: DurableObjectState, env: WorkerEnv) {
    this.state = state;
    this.env = env;
  }

  /** Cached npm bundle + optional stale fallback (same pattern as GitHub). */
  private async getNpmEnvelope(force: boolean): Promise<NpmBundleCacheEnvelope> {
    const record = await this.state.storage.get<NpmCacheRecord>(NPM_BUNDLE_STORAGE_KEY);
    const now = nowUnix();

    if (!force && record && record.expiresAtUnix > now) {
      return {
        source: "cache",
        stale: false,
        fetchedAtUnix: record.fetchedAtUnix,
        expiresAtUnix: record.expiresAtUnix,
        nextRefreshUnix: record.expiresAtUnix,
        packages: record.data,
      };
    }

    const live = await fetchNpmBundle(this.env);
    const fetchedAtUnix = now;
    const expiresAtUnix = now + NPM_TTL_SECONDS;

    const nextRecord: NpmCacheRecord = {
      fetchedAtUnix,
      expiresAtUnix,
      data: live,
    };
    await this.state.storage.put(NPM_BUNDLE_STORAGE_KEY, nextRecord);

    return {
      source: "live",
      stale: false,
      fetchedAtUnix,
      expiresAtUnix,
      nextRefreshUnix: expiresAtUnix,
      packages: live,
    };
  }

  private async respondNpm(force: boolean): Promise<Response> {
    const envelope = await this.getNpmEnvelope(force);
    const body: CachedNpmPayload = { ok: true, ...envelope };
    return json(body);
  }

  private async respondGitHubWithNpm(
    pathname: string,
    owner: string,
    repo: string,
    force: boolean,
  ): Promise<Response> {
    const key = `${owner}/${repo}`;
    const record = await this.state.storage.get<GitHubCacheRecord>(key);
    const now = nowUnix();

    const attachNpm = ["/metadata", "/repo", "/contributors"].includes(pathname);

    let githubPayload: CachedGitHubPayload;

    if (!force && record && record.expiresAtUnix > now) {
      githubPayload = {
        ok: true,
        source: "cache",
        stale: false,
        fetchedAtUnix: record.fetchedAtUnix,
        expiresAtUnix: record.expiresAtUnix,
        nextRefreshUnix: record.expiresAtUnix,
        data: record.data,
      };
    } else {
      const live = await fetchGitHub(owner, repo, this.env.GITHUB_TOKEN);
      const fetchedAtUnix = now;
      const expiresAtUnix = now + GITHUB_TTL_SECONDS;

      if (live.apiError && record) {
        githubPayload = {
          ok: true,
          source: "stale-cache",
          stale: true,
          fetchedAtUnix: record.fetchedAtUnix,
          expiresAtUnix: record.expiresAtUnix,
          nextRefreshUnix: now + GITHUB_TTL_SECONDS,
          data: record.data,
        };
      } else {
        const nextRecord: GitHubCacheRecord = {
          fetchedAtUnix,
          expiresAtUnix,
          data: live,
        };
        await this.state.storage.put(key, nextRecord);
        githubPayload = {
          ok: true,
          source: "live",
          stale: false,
          fetchedAtUnix,
          expiresAtUnix,
          nextRefreshUnix: expiresAtUnix,
          data: live,
        };
      }
    }

    if (attachNpm) {
      const npm = await this.getNpmEnvelope(force);
      return json({ ...githubPayload, npm } satisfies CachedGitHubPayload);
    }

    return json(githubPayload);
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return json({ ok: true, durableObject: true, nowUnix: nowUnix() });
    }

    const force = url.searchParams.get("force") === "1";
    const pathname = url.pathname === "" ? "/" : url.pathname;

    if (isNpmPath(pathname)) {
      return this.respondNpm(force);
    }

    const owner = GITHUB_OWNER;
    const repo = GITHUB_REPO;
    const githubPath =
      pathname === "/metadata" || pathname === "/repo" || pathname === "/contributors"
        ? pathname
        : "/metadata";

    return this.respondGitHubWithNpm(githubPath, owner, repo, force);
  }
}
