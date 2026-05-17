import type { Context, Hono } from "hono";
import { OPENAPI_SPEC } from "../openapi/spec";
import { swaggerDocsHtml } from "./docs";
import { buildRootCatalog } from "./root";

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
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function registerRoutes(app: Hono<Env>) {
  app.get("/", (c) => {
    const origin = new URL(c.req.url).origin;
    return c.json(buildRootCatalog(origin));
  });

  app.get("/openapi.json", (c) => c.json(OPENAPI_SPEC));

  app.get("/docs", (c) => {
    const openapiUrl = `${new URL(c.req.url).origin}/openapi.json`;
    const html = swaggerDocsHtml(openapiUrl);
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  });

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "meta",
      nowUnix: Math.floor(Date.now() / 1000),
    }),
  );

  app.get("/v1/health", (c) =>
    c.json({
      ok: true,
      version: 1,
      generatedAtUnix: Math.floor(Date.now() / 1000),
      status: "ok",
    }),
  );

  app.get("/v1/meta", (c) => fetchFromDo(c, "/v1/meta"));
  app.get("/v1/github", (c) => fetchFromDo(c, "/v1/github"));
  app.get("/v1/npm", (c) => fetchFromDo(c, "/v1/npm"));
  app.get("/v1/extension", (c) => fetchFromDo(c, "/v1/extension"));

  app.notFound((c) =>
    c.json(
      {
        ok: false,
        version: 1,
        generatedAtUnix: Math.floor(Date.now() / 1000),
        error: {
          code: "NOT_FOUND",
          message: `No route for ${c.req.path}. See GET / for available endpoints.`,
        },
      },
      404,
    ),
  );
}
