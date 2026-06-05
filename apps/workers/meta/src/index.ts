import { Hono } from "hono";
import { cors } from "hono/cors";
import { cloudflareDefaultHostRedirectFor } from "@i18nprune/seo";
import { MetaCacheDO } from "./lib/do";
import { registerRoutes } from "./routes";

type Env = {
  Bindings: {
    META_CACHE: DurableObjectNamespace;
  };
};

const app = new Hono<Env>();

app.use("*", async (c, next) => {
  const target = cloudflareDefaultHostRedirectFor(c.req.url, "meta", ".workers.dev");
  if (target) return c.redirect(target, 301);
  await next();
  const path = new URL(c.req.url).pathname;
  if (path !== "/docs" && path !== "/robots.txt" && !path.startsWith("/assets/")) {
    c.res.headers.set("X-Robots-Tag", "noindex");
  }
});

app.use("*", cors());
registerRoutes(app);

export { MetaCacheDO };
export default app;
