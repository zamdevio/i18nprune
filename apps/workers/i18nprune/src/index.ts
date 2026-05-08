import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registerRoutes } from './routes';
import type { WorkerEnv } from './routes';
import { ProjectStoreDO } from './lib/do';

const app = new Hono<WorkerEnv>();
app.use('*', cors());
registerRoutes(app);

export { ProjectStoreDO };
export default app;
