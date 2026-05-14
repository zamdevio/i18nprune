import { Hono } from "hono";
import { cors } from "hono/cors";
import { MetaCacheDO } from "./lib/do";
import { registerRoutes } from "./routes";

type Env = {
  Bindings: {
    META_CACHE: DurableObjectNamespace;
  };
};

const app = new Hono<Env>();
app.use("*", cors());
registerRoutes(app);

export { MetaCacheDO };
export default app;
