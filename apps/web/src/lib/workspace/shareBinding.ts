import { resolveShareWorkerBaseUrl, type WorkspaceSession, type WorkspaceWorkerShareBinding } from '@i18nprune/core';

/** Stable key for config merged at share / upload time (trimmed textarea or zip-only). */
export function workspaceShareConfigFingerprint(configJson?: string): string {
  return (configJson ?? '').trim();
}

function normalizeWorkerBase(url: string): string {
  return url.replace(/\/$/, '');
}

/** Worker API base for this session — never empty (`''` does not block `??` fallbacks). */
export function workspaceEffectiveWorkerBaseUrl(
  session: WorkspaceSession,
  settingsWorkerUrl: string,
): string {
  if (session.mode === 'remote') {
    return resolveShareWorkerBaseUrl(session.workerBaseUrl || settingsWorkerUrl);
  }
  const bound = session.workerShare?.workerBaseUrl?.trim();
  if (bound) return resolveShareWorkerBaseUrl(bound);
  return resolveShareWorkerBaseUrl(settingsWorkerUrl);
}

export function workspaceShareBindingMatches(
  binding: WorkspaceWorkerShareBinding | undefined,
  workerBaseUrl: string,
  configJson?: string,
): boolean {
  if (!binding) return false;
  return (
    normalizeWorkerBase(binding.workerBaseUrl) === normalizeWorkerBase(workerBaseUrl) &&
    binding.configFingerprint === workspaceShareConfigFingerprint(configJson)
  );
}

/** Local session already uploaded this zip + config fingerprint — show Copy link only. */
export function localWorkspaceShareIsLinkOnly(
  session: WorkspaceSession,
  workerBaseUrl: string,
  configJson?: string,
): session is WorkspaceSession & { mode: 'local'; workerShare: WorkspaceWorkerShareBinding } {
  return (
    session.mode === 'local' &&
    workspaceShareBindingMatches(session.workerShare, workerBaseUrl, configJson)
  );
}

export function withoutLocalWorkerShare(session: WorkspaceSession): WorkspaceSession {
  if (session.mode !== 'local') return session;
  const { workerShare: _removed, ...rest } = session;
  return rest;
}

/** Repair bindings saved before worker URL was persisted (empty string broke delete / link-only). */
export function healLocalWorkerShareBinding(
  session: WorkspaceSession,
  settingsWorkerUrl: string,
): WorkspaceSession {
  if (session.mode !== 'local' || !session.workerShare) return session;
  if (session.workerShare.workerBaseUrl.trim().length > 0) return session;
  return {
    ...session,
    workerShare: {
      ...session.workerShare,
      workerBaseUrl: resolveShareWorkerBaseUrl(settingsWorkerUrl),
    },
  };
}
