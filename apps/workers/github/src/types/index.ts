export type GitHubRepoPayload = {
  owner: string;
  repo: string;
  stars: number | null;
  forks: number | null;
  openIssues: number | null;
  watchers: number | null;
  contributors: number | null;
  apiError: string | null;
};

export type CachedGitHubPayload = {
  ok: boolean;
  source: "cache" | "live" | "stale-cache";
  stale: boolean;
  fetchedAtUnix: number;
  expiresAtUnix: number;
  nextRefreshUnix: number;
  data: GitHubRepoPayload;
};

export type WorkerEnv = {
  GITHUB_TOKEN?: string;
};
