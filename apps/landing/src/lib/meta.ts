import { META_WORKER_URL } from "../constants/site";

/** Mirrors `apps/workers/meta` `DEFAULT_LINKS` when the worker is unreachable. */
export const FALLBACK_LINKS = {
  githubRepo: "https://github.com/zamdevio/i18nprune",
  docs: "https://docs.i18nprune.dev",
  npmCli: "https://www.npmjs.com/package/i18nprune",
  npmCore: "https://www.npmjs.com/package/@i18nprune/core",
  webApp: "https://web.i18nprune.dev",
  workerDocs: "https://worker.i18nprune.dev/docs",
  report: "https://report.i18nprune.dev",
  gitAnalytics: "https://git.i18nprune.dev",
  sandbox: "https://codesandbox.io/p/sandbox/ltw939",
  license: "https://github.com/zamdevio/i18nprune/blob/main/LICENSE",
  twitter: "https://twitter.com/zamdevio",
  vscodeMarketplace: "https://marketplace.visualstudio.com/items?itemName=zamdevio.i18nprune",
  openVsx: "https://open-vsx.org/extension/zamdevio/i18nprune",
} as const satisfies Record<string, string>;

export type MetaLinkKey = keyof typeof FALLBACK_LINKS;

/** Shown until `/v1/meta` returns a CLI version. */
export const FALLBACK_CLI_VERSION = "0.1.0";

export type MetaV1Ok = {
  ok: true;
  version: number;
  generatedAtUnix: number;
  cache: {
    github: { stale: boolean; updatedAtUnix: number; expiresAtUnix: number };
    npm: { stale: boolean; updatedAtUnix: number; expiresAtUnix: number };
    extension: { stale: boolean; updatedAtUnix: number; expiresAtUnix: number };
  };
  links: Record<string, string>;
  github: {
    owner: string;
    repo: string;
    stars?: number | null;
    forks?: number | null;
    openIssues?: number | null;
    watchers?: number | null;
    contributors?: number | null;
    error?: string | null;
  };
  npm: {
    cli: { name: string; version: string | null; lastPublishUnix: number | null; error: string | null };
    core: { name: string; version: string | null; lastPublishUnix: number | null; error: string | null };
  };
  extension: {
    publisher: string;
    name: string;
    version: string | null;
    lastPublishUnix: number | null;
    error: string | null;
  };
};

const META_URL = `${META_WORKER_URL}/v1/meta`;

let inflight: Promise<MetaV1Ok | null> | null = null;

export async function fetchMetaV1(): Promise<MetaV1Ok | null> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(META_URL, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as MetaV1Ok;
      return json?.ok === true ? json : null;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function mergeLinks(workerLinks: Record<string, string> | undefined): Record<string, string> {
  return { ...FALLBACK_LINKS, ...(workerLinks ?? {}) };
}

export function linkHref(links: Record<string, string>, key: MetaLinkKey): string {
  return links[key] ?? FALLBACK_LINKS[key];
}
