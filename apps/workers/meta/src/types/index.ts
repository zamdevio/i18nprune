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

/** One row from registry.npmjs.org …/latest (or error). */
export type NpmPackageInfo = {
  /** Registry name, e.g. i18nprune or @i18nprune/core */
  name: string;
  version: string | null;
  /** npm "time.modified" of the resolved dist-tag when available */
  lastPublishUnix: number | null;
  registryError: string | null;
};

export type NpmBundlePayload = {
  cli: NpmPackageInfo;
  core: NpmPackageInfo;
  extension: NpmPackageInfo;
};

export type NpmBundleCacheEnvelope = {
  source: "cache" | "live" | "stale-cache";
  stale: boolean;
  fetchedAtUnix: number;
  expiresAtUnix: number;
  nextRefreshUnix: number;
  packages: NpmBundlePayload;
};

export type CachedGitHubPayload = {
  ok: boolean;
  source: "cache" | "live" | "stale-cache";
  stale: boolean;
  fetchedAtUnix: number;
  expiresAtUnix: number;
  nextRefreshUnix: number;
  data: GitHubRepoPayload;
  /** Present on GET /metadata, /repo, /contributors when npm bundle was resolved. */
  npm?: NpmBundleCacheEnvelope;
};

export type CachedNpmPayload = { ok: boolean } & NpmBundleCacheEnvelope;

export type WorkerEnv = {
  GITHUB_TOKEN?: string;
  /** Override default i18nprune */
  NPM_CLI_PACKAGE?: string;
  /** Override default @i18nprune/core */
  NPM_CORE_PACKAGE?: string;
  /** Override default @i18nprune/extension (often unpublished until you ship) */
  NPM_EXTENSION_PACKAGE?: string;
};
