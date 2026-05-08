import { GITHUB_OWNER, GITHUB_REPO, LINKS } from "../constants/links";
import { safeFetchJson } from "./http";

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

type WorkerGithubPayload = {
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

function asNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

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
  const worker = await safeFetchJson<WorkerGithubPayload>(
    workerUrl,
    { headers: { Accept: "application/json" } },
    7000,
  );
  if (worker.ok && worker.data?.data) {
    const payload = worker.data.data;
    return {
      stars: asNumberOrNull(payload.stars),
      forks: asNumberOrNull(payload.forks),
      openIssues: asNumberOrNull(payload.openIssues),
      watchers: asNumberOrNull(payload.watchers),
      contributors: asNumberOrNull(payload.contributors),
      apiError: typeof payload.apiError === "string" ? payload.apiError : null,
      fetchedAtUnix: asNumberOrNull(worker.data.fetchedAtUnix) ?? undefined,
      expiresAtUnix: asNumberOrNull(worker.data.expiresAtUnix) ?? undefined,
      nextRefreshUnix: asNumberOrNull(worker.data.nextRefreshUnix) ?? undefined,
      source: worker.data.source,
      stale: typeof worker.data.stale === "boolean" ? worker.data.stale : undefined,
    };
  }
  return {
    stars: null,
    forks: null,
    openIssues: null,
    watchers: null,
    contributors: null,
    apiError: worker.error ?? "GitHub metadata worker unavailable",
  };
}
