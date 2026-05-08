import type { ProjectStoreRow } from '../../lib/do';
import type { WorkerEnv } from '../types';

export function projectStore(env: WorkerEnv['Bindings']): DurableObjectStub {
  return env.PROJECT_STORE.get(env.PROJECT_STORE.idFromName('global'));
}

export async function getProjectById(stub: DurableObjectStub, projectId: string): Promise<ProjectStoreRow | null> {
  const resp = await stub.fetch(`https://do/project/${encodeURIComponent(projectId)}`);
  const body = (await resp.json()) as { project: ProjectStoreRow | null };
  return body.project;
}
