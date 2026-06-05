import {
  FALLBACK_CLI_VERSION,
  GITHUB_OWNER,
  GITHUB_REPO,
  META_WORKER_URL,
} from './constants.js';
import type { ProductMetaSnapshot } from './types.js';

type MetaV1Like = {
  ok?: boolean;
  github?: {
    owner?: string;
    repo?: string;
    stars?: number | null;
    error?: string | null;
  };
  npm?: {
    cli?: { version?: string | null };
    core?: { version?: string | null };
  };
};

export const META_V1_URL = `${META_WORKER_URL}/v1/meta` as const;

/** Map a `/v1/meta` JSON body to a build-time SEO snapshot. */
export function parseMetaV1ForSeo(json: unknown): ProductMetaSnapshot | null {
  if (!json || typeof json !== 'object') return null;
  const body = json as MetaV1Like;
  if (body.ok !== true) return null;

  const cliRaw = body.npm?.cli?.version;
  const coreRaw = body.npm?.core?.version;
  const cliVersion =
    typeof cliRaw === 'string' && cliRaw.length > 0 ? cliRaw : FALLBACK_CLI_VERSION;

  return {
    cliVersion,
    coreVersion:
      typeof coreRaw === 'string' && coreRaw.length > 0 ? coreRaw : undefined,
    githubStars: body.github?.error == null ? (body.github?.stars ?? null) : null,
    githubOwner: body.github?.owner ?? GITHUB_OWNER,
    githubRepo: body.github?.repo ?? GITHUB_REPO,
  };
}

export function defaultProductMetaSnapshot(
  cliVersion: string = FALLBACK_CLI_VERSION,
): ProductMetaSnapshot {
  return {
    cliVersion,
    githubOwner: GITHUB_OWNER,
    githubRepo: GITHUB_REPO,
    githubStars: null,
  };
}
