import path from 'node:path';
import { resolveContext, createCliCoreContext } from '@/shared/context/index.js';
import { configPathForContext } from '@/shared/config/paths.js';

export async function resolveKitsBundle() {
  const ctx = await resolveContext();
  const coreCtx = createCliCoreContext(ctx);
  const configPath = configPathForContext();
  const projectRoot = configPath ? path.dirname(configPath) : process.cwd();
  return { ctx, coreCtx, projectRoot };
}
