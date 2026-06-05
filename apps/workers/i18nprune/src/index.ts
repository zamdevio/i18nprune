import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cloudflareDefaultHostRedirectFor } from '@i18nprune/seo';
import { registerRoutes } from './routes';
import type { WorkerEnv } from './routes';
import { ProjectStoreDO } from './lib/do';

const app = new Hono<WorkerEnv>();

app.use('*', async (c, next) => {
  const target = cloudflareDefaultHostRedirectFor(c.req.url, 'worker', '.workers.dev');
  if (target) return c.redirect(target, 301);
  await next();
  const path = new URL(c.req.url).pathname;
  if (path !== '/docs' && path !== '/robots.txt' && !path.startsWith('/assets/')) {
    c.res.headers.set('X-Robots-Tag', 'noindex');
  }
});

app.use('*', cors());
registerRoutes(app);

export { ProjectStoreDO };
export default app;
