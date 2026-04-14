import { Hono } from "hono";
import { cors } from "hono/cors";
import { GitHubCacheDO } from "./lib/do";
import { registerRoutes } from "./routes";

type Env = {
  Bindings: {
    GITHUB_CACHE: DurableObjectNamespace;
  };
};

const app = new Hono<Env>();
app.use("*", cors());
registerRoutes(app);

export { GitHubCacheDO };
export default app;
