import type { Context, Hono } from "hono";
import type { CachedGitHubPayload, CachedNpmPayload, NpmPackageInfo } from "../types";

type Env = {
  Bindings: {
    META_CACHE: DurableObjectNamespace;
  };
};

function doUrl(path: string, reqUrl: string): string {
  const force = new URL(reqUrl).searchParams.get("force") === "1";
  return `https://meta-cache${path}${force ? "?force=1" : ""}`;
}

async function fetchFromDo(c: Context<Env>, path: string) {
  const id = c.env.META_CACHE.idFromName("canonical-repo");
  const stub = c.env.META_CACHE.get(id);
  const upstream = await stub.fetch(doUrl(path, c.req.url));
  const payload = (await upstream.json()) as CachedGitHubPayload | CachedNpmPayload;
  return c.json(payload, upstream.status as 200 | 400 | 500);
}

type NpmSlot = "cli" | "core" | "extension";

function slotResponse(full: CachedNpmPayload, slot: NpmSlot) {
  const pkg: NpmPackageInfo = full.packages[slot];
  return {
    ok: full.ok,
    slot,
    source: full.source,
    stale: full.stale,
    fetchedAtUnix: full.fetchedAtUnix,
    expiresAtUnix: full.expiresAtUnix,
    nextRefreshUnix: full.nextRefreshUnix,
    package: pkg,
  };
}

async function fetchNpmSlot(c: Context<Env>, slot: NpmSlot) {
  const id = c.env.META_CACHE.idFromName("canonical-repo");
  const stub = c.env.META_CACHE.get(id);
  const upstream = await stub.fetch(doUrl("/npm", c.req.url));
  const full = (await upstream.json()) as CachedNpmPayload;
  return c.json(slotResponse(full, slot), upstream.status as 200 | 400 | 500);
}

export function registerRoutes(app: Hono<Env>) {
  app.get("/", (c) =>
    c.json({
      ok: true,
      service: "meta",
      usage: {
        endpoints: [
          { path: "/", purpose: "Route help and examples." },
          { path: "/health", purpose: "Liveness response." },
          { path: "/metadata", purpose: "GitHub repo payload + npm bundle (cli, core, extension)." },
          { path: "/repo", purpose: "Same as /metadata (alias)." },
          { path: "/contributors", purpose: "Same as /metadata (alias)." },
          { path: "/npm", purpose: "Standalone npm bundle: cli, core, extension (registry.npmjs.org)." },
          { path: "/npm/cli", purpose: "Single-package view: CLI row only (same cache as /npm)." },
          { path: "/npm/core", purpose: "Single-package view: @i18nprune/core only." },
          { path: "/npm/extension", purpose: "Single-package view: extension package name (often unpublished until shipped)." },
        ],
        examples: [
          "curl https://meta.i18nprune.dev/health",
          "curl https://meta.i18nprune.dev/metadata",
          "curl https://meta.i18nprune.dev/npm",
          "curl https://meta.i18nprune.dev/npm/core",
        ],
      },
    }),
  );
  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "meta",
      nowUnix: Math.floor(Date.now() / 1000),
    }),
  );
  app.get("/metadata", async (c) => fetchFromDo(c, "/metadata"));
  app.get("/repo", async (c) => fetchFromDo(c, "/repo"));
  app.get("/contributors", async (c) => fetchFromDo(c, "/contributors"));

  app.get("/npm", async (c) => fetchFromDo(c, "/npm"));

  app.get("/npm/cli", (c) => fetchNpmSlot(c, "cli"));
  app.get("/npm/core", (c) => fetchNpmSlot(c, "core"));
  app.get("/npm/extension", (c) => fetchNpmSlot(c, "extension"));
}
