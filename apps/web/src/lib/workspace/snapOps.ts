/**
 * Workspace read-only ops: prefer in-memory snapshot (local session or wsSnapHold) + localWorkerShim,
 * same data paths as worker routes (getProjectById → project.snapshot, no extractor rescan).
 */
import type { ApiEnvelope } from '../services/api/client';
import {
  getProjectMetadata,
  getProjectSnapshot,
  getProjectTree,
  getWorkerDoctor,
  getWorkerLocaleByTag,
  getWorkerLocales,
  runWorkerMissing,
  runWorkerReport,
  runWorkerReview,
  runWorkerValidate,
} from '../services/api/client';
import type { WorkspaceSession } from '../../types/workspace';
import {
  localGetDoctor,
  localGetLocaleByTag,
  localGetLocales,
  localGetMetadata,
  localGetSnapshot,
  localGetTree,
  localRunMissing,
  localRunReport,
  localRunReview,
  localRunValidate,
} from '../services/core/localWorkerShim';
import { setSnapFromEnv, snapBackedLocal, snapEpoch, snapHydrateRemote } from './snapHold';

export async function snapMetadata(session: WorkspaceSession, workerBaseUrl: string, projectId: string): Promise<ApiEnvelope<unknown>> {
  if (session.mode === 'local') return localGetMetadata(session.local);
  await snapHydrateRemote(session);
  const backed = snapBackedLocal(session);
  if (backed) return localGetMetadata(backed);
  return getProjectMetadata(workerBaseUrl, projectId);
}

export async function snapTree(session: WorkspaceSession, workerBaseUrl: string, projectId: string): Promise<ApiEnvelope<unknown>> {
  if (session.mode === 'local') return localGetTree(session.local);
  await snapHydrateRemote(session);
  const backed = snapBackedLocal(session);
  if (backed) return localGetTree(backed);
  return getProjectTree(workerBaseUrl, projectId);
}

export async function snapSnapshot(session: WorkspaceSession, workerBaseUrl: string, projectId: string): Promise<ApiEnvelope<unknown>> {
  if (session.mode === 'local') return localGetSnapshot(session.local);
  const e0 = snapEpoch();
  const res = await getProjectSnapshot(workerBaseUrl, projectId);
  setSnapFromEnv(session, res as ApiEnvelope<unknown>, e0);
  return res as ApiEnvelope<unknown>;
}

export async function snapValidate(session: WorkspaceSession, workerBaseUrl: string, projectId: string): Promise<ApiEnvelope<unknown>> {
  if (session.mode === 'local') return localRunValidate(session.local);
  await snapHydrateRemote(session);
  const backed = snapBackedLocal(session);
  if (backed) return localRunValidate(backed);
  return runWorkerValidate(workerBaseUrl, projectId);
}

export async function snapReview(session: WorkspaceSession, workerBaseUrl: string, projectId: string): Promise<ApiEnvelope<unknown>> {
  if (session.mode === 'local') return localRunReview(session.local);
  await snapHydrateRemote(session);
  const backed = snapBackedLocal(session);
  if (backed) return localRunReview(backed);
  return runWorkerReview(workerBaseUrl, projectId);
}

export async function snapReport(session: WorkspaceSession, workerBaseUrl: string, projectId: string): Promise<ApiEnvelope<unknown>> {
  if (session.mode === 'local') return localRunReport(session.local);
    await snapHydrateRemote(session);
  const backed = snapBackedLocal(session);
  if (backed) return localRunReport(backed);
  return runWorkerReport(workerBaseUrl, projectId);
}

export async function snapMissing(
  session: WorkspaceSession,
  workerBaseUrl: string,
  projectId: string,
  missingTargetTag: string,
): Promise<ApiEnvelope<unknown>> {
  if (session.mode === 'local') return localRunMissing(session.local, missingTargetTag);
  await snapHydrateRemote(session);
  const backed = snapBackedLocal(session);
  if (backed) return localRunMissing(backed, missingTargetTag);
  return runWorkerMissing(workerBaseUrl, projectId, missingTargetTag);
}

export async function snapLocs(session: WorkspaceSession, workerBaseUrl: string, projectId: string): Promise<ApiEnvelope<unknown>> {
  if (session.mode === 'local') return localGetLocales(session.local);
  await snapHydrateRemote(session);
  const backed = snapBackedLocal(session);
  if (backed) return localGetLocales(backed);
  return getWorkerLocales(workerBaseUrl, projectId);
}

export async function snapLocTag(
  session: WorkspaceSession,
  workerBaseUrl: string,
  projectId: string,
  localeTag: string,
): Promise<ApiEnvelope<unknown>> {
  if (session.mode === 'local') return localGetLocaleByTag(session.local, localeTag);
  await snapHydrateRemote(session);
  const backed = snapBackedLocal(session);
  if (backed) return localGetLocaleByTag(backed, localeTag);
  return getWorkerLocaleByTag(workerBaseUrl, projectId, localeTag);
}

export async function snapDoctor(session: WorkspaceSession, workerBaseUrl: string, projectId: string): Promise<ApiEnvelope<unknown>> {
  if (session.mode === 'local') return localGetDoctor(session.local);
  await snapHydrateRemote(session);
  const backed = snapBackedLocal(session);
  if (backed) return localGetDoctor(backed);
  return getWorkerDoctor(workerBaseUrl, projectId);
}
