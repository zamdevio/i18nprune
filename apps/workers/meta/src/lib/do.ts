import { GITHUB_OWNER, GITHUB_REPO } from "../constants/github";
import { fetchExtensionRow } from "../services/extension";
import { fetchGithubRepo } from "../services/github";
import { fetchNpmCliCore } from "../services/npm";
import { buildLinks } from "../services/links";
import { sliceMetaV1 } from "../services/meta";
import type {
  ExtensionCacheRecord,
  ExtensionRowV1,
  GitHubCacheRecord,
  MetaV1Body,
  MetaV1ErrorBody,
  NpmCacheRecord,
  WorkerEnv,
} from "../types";

const GITHUB_TTL = 120;
const NPM_TTL = 600;
const EXTENSION_TTL = 900;

const NPM_KEY = "v1:npm:cli-core";
const EXT_KEY = "v1:extension:marketplace";

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

export class MetaCacheDO {
  private readonly state: DurableObjectState;
  private readonly env: WorkerEnv;

  constructor(state: DurableObjectState, env: WorkerEnv) {
    this.state = state;
    this.env = env;
  }

  private async resolveGithub(
    owner: string,
    repo: string,
    force: boolean,
    now: number,
  ): Promise<{ data: GitHubCacheRecord["data"]; slice: MetaV1Body["cache"]["github"] }> {
    const key = `${owner}/${repo}`;
    const record = await this.state.storage.get<GitHubCacheRecord>(key);

    if (!force && record && record.expiresAtUnix > now) {
      return {
        data: record.data,
        slice: { stale: false, updatedAtUnix: record.fetchedAtUnix, expiresAtUnix: record.expiresAtUnix },
      };
    }

    const live = await fetchGithubRepo(owner, repo, this.env.GITHUB_TOKEN);
    const fetchedAtUnix = now;
    const expiresAtUnix = now + GITHUB_TTL;

    if (live.error && record) {
      return {
        data: record.data,
        slice: {
          stale: true,
          updatedAtUnix: record.fetchedAtUnix,
          expiresAtUnix: record.expiresAtUnix,
        },
      };
    }

    const next: GitHubCacheRecord = { fetchedAtUnix, expiresAtUnix, data: live };
    await this.state.storage.put(key, next);
    return {
      data: live,
      slice: { stale: false, updatedAtUnix: fetchedAtUnix, expiresAtUnix },
    };
  }

  private async resolveNpm(
    force: boolean,
    now: number,
  ): Promise<{ data: NpmCacheRecord["data"]; slice: MetaV1Body["cache"]["npm"] }> {
    const record = await this.state.storage.get<NpmCacheRecord>(NPM_KEY);

    if (!force && record && record.expiresAtUnix > now) {
      return {
        data: record.data,
        slice: { stale: false, updatedAtUnix: record.fetchedAtUnix, expiresAtUnix: record.expiresAtUnix },
      };
    }

    const live = await fetchNpmCliCore(this.env);
    const fetchedAtUnix = now;
    const expiresAtUnix = now + NPM_TTL;
    const next: NpmCacheRecord = { fetchedAtUnix, expiresAtUnix, data: live };
    await this.state.storage.put(NPM_KEY, next);
    return {
      data: live,
      slice: { stale: false, updatedAtUnix: fetchedAtUnix, expiresAtUnix },
    };
  }

  private async resolveExtension(
    force: boolean,
    now: number,
  ): Promise<{ data: ExtensionRowV1; slice: MetaV1Body["cache"]["extension"] }> {
    const record = await this.state.storage.get<ExtensionCacheRecord>(EXT_KEY);

    if (!force && record && record.expiresAtUnix > now) {
      return {
        data: record.data,
        slice: { stale: false, updatedAtUnix: record.fetchedAtUnix, expiresAtUnix: record.expiresAtUnix },
      };
    }

    const live = await fetchExtensionRow();
    const fetchedAtUnix = now;
    const expiresAtUnix = now + EXTENSION_TTL;
    const next: ExtensionCacheRecord = { fetchedAtUnix, expiresAtUnix, data: live };
    await this.state.storage.put(EXT_KEY, next);
    return {
      data: live,
      slice: { stale: false, updatedAtUnix: fetchedAtUnix, expiresAtUnix },
    };
  }

  private async buildMetaV1(force: boolean): Promise<MetaV1Body> {
    const owner = GITHUB_OWNER;
    const repo = GITHUB_REPO;
    const now = nowUnix();

    const [gh, npm, ext] = await Promise.all([
      this.resolveGithub(owner, repo, force, now),
      this.resolveNpm(force, now),
      this.resolveExtension(force, now),
    ]);

    const links = buildLinks(this.env);

    return {
      ok: true,
      version: 1,
      generatedAtUnix: nowUnix(),
      cache: {
        github: gh.slice,
        npm: npm.slice,
        extension: ext.slice,
      },
      links,
      github: gh.data,
      npm: npm.data,
      extension: ext.data,
    };
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/health") {
      return json({ ok: true, durableObject: true, nowUnix: nowUnix() });
    }

    const force = url.searchParams.get("force") === "1";
    const full = await this.buildMetaV1(force);

    if (path === "/v1/meta") return json(full);
    if (path === "/v1/github") return json(sliceMetaV1(full, "github"));
    if (path === "/v1/npm") return json(sliceMetaV1(full, "npm"));
    if (path === "/v1/extension") return json(sliceMetaV1(full, "extension"));

    return json(
      {
        ok: false,
        version: 1,
        generatedAtUnix: nowUnix(),
        error: { code: "NOT_FOUND", message: `unknown DO path: ${path}` },
      } satisfies MetaV1ErrorBody,
      { status: 404 },
    );
  }
}
