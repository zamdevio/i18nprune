import type { Context, Hono } from "hono";
import type { CachedGitHubPayload } from "../types";

type Env = {
  Bindings: {
    GITHUB_CACHE: DurableObjectNamespace;
  };
};

async function fetchFromDo(
  c: Context<Env>,
  route: "metadata" | "repo" | "contributors",
) {
  const id = c.env.GITHUB_CACHE.idFromName("canonical-repo");
  const stub = c.env.GITHUB_CACHE.get(id);
  const upstream = await stub.fetch(`https://github-cache/${route}`);
  const payload = (await upstream.json()) as CachedGitHubPayload;
  return c.json(payload, upstream.status as 200 | 400 | 500);
}

export function registerRoutes(app: Hono<Env>) {
  app.get("/", (c) =>
    c.json({
      ok: true,
      service: "github-i18nprune",
      usage: {
        endpoints: [
          { path: "/", purpose: "Route help and examples." },
          { path: "/health", purpose: "Liveness response." },
          { path: "/metadata", purpose: "Combined GitHub metadata payload." },
          { path: "/repo", purpose: "Repository-level metadata payload." },
          { path: "/contributors", purpose: "Contributor-focused payload." },
        ],
        examples: [
          "curl https://github.i18nprune.dev/health",
          "curl https://github.i18nprune.dev/metadata",
          "curl https://github.i18nprune.dev/repo",
          "curl https://github.i18nprune.dev/contributors",
        ],
      },
    }),
  );
  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "github-i18nprune",
      nowUnix: Math.floor(Date.now() / 1000),
    }),
  );
  app.get("/metadata", async (c) => fetchFromDo(c, "metadata"));
  app.get("/repo", async (c) => fetchFromDo(c, "repo"));
  app.get("/contributors", async (c) => fetchFromDo(c, "contributors"));
}
