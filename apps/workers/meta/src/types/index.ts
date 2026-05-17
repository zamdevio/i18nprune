/** API contract revision (matches URL prefix /v1/). */
export type ApiVersion = 1;

export type CacheSliceV1 = {
  stale: boolean;
  updatedAtUnix: number;
  expiresAtUnix: number;
};

export type NpmRowV1 = {
  name: string;
  version: string | null;
  lastPublishUnix: number | null;
  error: string | null;
};

export type ExtensionRowV1 = {
  publisher: string;
  name: string;
  version: string | null;
  lastPublishUnix: number | null;
  error: string | null;
};

export type GitHubRepoV1 = {
  owner: string;
  repo: string;
  stars: number | null;
  forks: number | null;
  openIssues: number | null;
  watchers: number | null;
  contributors: number | null;
  error: string | null;
};

export type MetaV1Body = {
  ok: true;
  version: ApiVersion;
  generatedAtUnix: number;
  cache: {
    github: CacheSliceV1;
    npm: CacheSliceV1;
    extension: CacheSliceV1;
  };
  links: Record<string, string>;
  github: GitHubRepoV1;
  npm: {
    cli: NpmRowV1;
    core: NpmRowV1;
  };
  extension: ExtensionRowV1;
};

export type MetaV1ErrorBody = {
  ok: false;
  version: ApiVersion;
  generatedAtUnix: number;
  error: {
    code: string;
    message: string;
  };
};

export type WorkerEnv = {
  GITHUB_TOKEN?: string;
  NPM_CLI_PACKAGE?: string;
  NPM_CORE_PACKAGE?: string;
};

/** Internal DO storage rows (before mapping to public `error` field). */
export type GitHubCacheRecord = {
  fetchedAtUnix: number;
  expiresAtUnix: number;
  data: GitHubRepoV1;
};

export type NpmCacheRecord = {
  fetchedAtUnix: number;
  expiresAtUnix: number;
  data: { cli: NpmRowV1; core: NpmRowV1 };
};

export type ExtensionCacheRecord = {
  fetchedAtUnix: number;
  expiresAtUnix: number;
  data: ExtensionRowV1;
};
