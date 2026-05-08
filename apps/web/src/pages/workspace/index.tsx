import { useEffect, useMemo, useRef, useState } from 'react';
import { buildLocalProjectFromZip } from '../../lib/services/core/buildLocalProject';
import {
  deleteProject,
  isWorkerProjectNotFoundError,
  uploadProject,
} from '../../lib/services/api/client';
import { navigateHash } from '../../hooks/useHashRoute';
import { collectWorkspaceIssuesFromResultPayload } from '../../lib/services/core/workspaceIssues';
import { mergeConfigJsonOntoZipBase } from '../../lib/services/core/mergeZipConfig';
import { clearOpMemo, readOpMemo, opMemoKey, writeOpMemo } from '../../lib/workspace/opMemo';
import { clearSnapHold, snapHydrateRemote } from '../../lib/workspace/snapHold';
import type { ApiEnvelope } from '../../lib/services/api/client';
import type { WorkspaceConfigHintState, WorkspaceSession } from '../../types/workspace';
import { Config } from './config';
import { Operations } from './operations';
import { Result } from './result';

type Props = {
  session: WorkspaceSession | null;
  onSessionChange: (next: WorkspaceSession | null) => void;
};

export function WorkspacePage({ session, onSessionChange }: Props) {
  const [configJson, setConfigJson] = useState('');
  const [overrideApplied, setOverrideApplied] = useState(false);
  const [localeTag, setLocaleTag] = useState('');
  const [missingTargetTag, setMissingTargetTag] = useState('');
  const [resultPayload, setResultPayload] = useState<unknown | null>(null);
  const [resultTitle, setResultTitle] = useState('JSON preview');
  const [latestCurl, setLatestCurl] = useState<string>('');
  const [latestUploadMeta, setLatestUploadMeta] = useState<{
    uploadedAt?: string;
    extractionComputedAt?: string;
  }>({});
  const [busy, setBusy] = useState(false);
  const [remoteProjectMissingBanner, setRemoteProjectMissingBanner] = useState(false);
  const [configHint, setConfigHint] = useState<WorkspaceConfigHintState>({
    kind: 'idle',
    ok: false,
    message: 'Loading config check…',
  });
  const prevConfigJsonForCacheRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    clearOpMemo();
    clearSnapHold();
    prevConfigJsonForCacheRef.current = undefined;
    setRemoteProjectMissingBanner(false);
    if (session?.mode === 'remote') {
      void snapHydrateRemote(session);
    }
  }, [session]);

  useEffect(() => {
    if (prevConfigJsonForCacheRef.current === undefined) {
      prevConfigJsonForCacheRef.current = configJson;
      return;
    }
    if (prevConfigJsonForCacheRef.current === configJson) return;
    prevConfigJsonForCacheRef.current = configJson;
    const id = window.setTimeout(() => {
      clearOpMemo();
    }, 400);
    return () => window.clearTimeout(id);
  }, [configJson]);

  useEffect(() => {
    if (session?.mode === 'remote' && session.uploadMeta) {
      setLatestUploadMeta({
        uploadedAt: session.uploadMeta.uploadedAt,
        extractionComputedAt: session.uploadMeta.extractionComputedAt,
      });
    }
  }, [session]);

  const isRemote = session?.mode === 'remote';
  const isLocal = session?.mode === 'local';
  const projectId = session?.mode === 'remote' ? session.projectId : session?.mode === 'local' ? session.local.projectId : '';
  const workerBaseUrl = session?.mode === 'remote' ? session.workerBaseUrl : '';
  const activeZipFile = session?.activeZipFile;

  const responseDataForViewer = useMemo(() => {
    if (resultPayload === null || resultPayload === undefined) return null;
    const env = resultPayload as ApiEnvelope<unknown>;
    if (env && typeof env === 'object' && 'data' in env) {
      const data = (env as ApiEnvelope<unknown>).data as unknown;
      if (resultTitle.toLowerCase().includes('report') && data && typeof data === 'object' && 'document' in (data as Record<string, unknown>)) {
        return (data as { document: unknown }).document;
      }
      return data ?? resultPayload;
    }
    return resultPayload;
  }, [resultPayload, resultTitle]);

  const workspaceIssues = useMemo(() => collectWorkspaceIssuesFromResultPayload(resultPayload), [resultPayload]);

  const configCheckGen = useRef(0);
  useEffect(() => {
    if (!activeZipFile || !session) {
      setConfigHint({ kind: 'idle', ok: false, message: 'Open a zip-backed session to validate config overrides.' });
      return;
    }
    const gen = ++configCheckGen.current;
    const raw = configJson.trim();
    const run = async (): Promise<void> => {
      if (raw.length === 0) {
        setConfigHint({ kind: 'checking', ok: false, message: 'Checking zip-only config…' });
      } else {
        setConfigHint({ kind: 'checking', ok: false, message: 'Merging with zip config…' });
      }
      try {
        const bytes = new Uint8Array(await activeZipFile.arrayBuffer());
        if (gen !== configCheckGen.current) return;
        const m = mergeConfigJsonOntoZipBase(bytes, raw.length > 0 ? configJson : undefined);
        if (gen !== configCheckGen.current) return;
        if (!m.ok) {
          setConfigHint({ kind: 'invalid', ok: false, message: m.message });
          return;
        }
        if (raw.length === 0) {
          setConfigHint({
            kind: 'empty',
            ok: true,
            message: 'No override: zip config is complete. You can reprocess to rebuild from the zip only.',
          });
        } else {
          setConfigHint({ kind: 'valid', ok: true, message: 'Merged config is valid and ready to apply.' });
        }
      } catch (e) {
        if (gen !== configCheckGen.current) return;
        setConfigHint({
          kind: 'invalid',
          ok: false,
          message: e instanceof Error ? e.message : 'Could not read the active zip for config validation.',
        });
      }
    };
    void run();
  }, [activeZipFile, configJson, session]);

  async function applyConfigOverride(configOverride: string | undefined): Promise<void> {
    if (!session) throw new Error('No active session.');
    if (!activeZipFile) throw new Error('Missing active workspace zip. Reopen from Home.');
    clearOpMemo();
    clearSnapHold();
    if (session.mode === 'local') {
      const bytes = new Uint8Array(await activeZipFile.arrayBuffer());
      const local = await buildLocalProjectFromZip(bytes, { configJson: configOverride });
      onSessionChange({
        mode: 'local',
        local,
        activeZipFile,
        label: activeZipFile.name,
      });
      return;
    }

    try {
      await deleteProject(workerBaseUrl, projectId);
    } catch {
      /* ignore cleanup failure and continue */
    }
    const res = await uploadProject(workerBaseUrl, activeZipFile, configOverride);
    const nextProjectId = (res.data as { projectId?: string } | null)?.projectId;
    if (!nextProjectId) throw new Error('Upload succeeded but projectId missing.');
    onSessionChange({
      mode: 'remote',
      workerBaseUrl,
      projectId: nextProjectId,
      activeZipFile,
      label: activeZipFile.name,
    });
    const snapshotMeta = (res.data as { snapshotMeta?: { uploadedAt?: string; extractionComputedAt?: string } } | null)?.snapshotMeta;
    setLatestUploadMeta({
      uploadedAt: snapshotMeta?.uploadedAt,
      extractionComputedAt: snapshotMeta?.extractionComputedAt,
    });
  }

  async function recoverRemoteProjectAfterEviction(): Promise<void> {
    if (!session || session.mode !== 'remote') return;
    if (!activeZipFile) {
      setResultTitle('Re-upload blocked');
      setResultPayload({
        message:
          'This session has no attached zip. Open the project again from Home, or open a row under Recent cached zips.',
      });
      return;
    }
    if (!configHint.ok) {
      setResultTitle('Re-upload blocked');
      setResultPayload({ message: configHint.message });
      return;
    }
    setBusy(true);
    try {
      clearOpMemo();
      await applyConfigOverride(configJson.trim() || undefined);
      setRemoteProjectMissingBanner(false);
      setResultTitle('Re-uploaded');
      setResultPayload({ ok: true, message: 'Project re-created on the worker from the active zip.' });
    } catch (e) {
      setResultTitle('Re-upload error');
      setResultPayload({ message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function runAction(label: string, action: () => Promise<unknown>, curlCommand?: string): Promise<void> {
    if (!session) return;
    setBusy(true);
    try {
      const cacheKey = opMemoKey(session, label);
      const hit = readOpMemo(cacheKey);
      if (hit) {
        setResultTitle(hit.title);
        setResultPayload(hit.payload);
        setLatestCurl(hit.curl);
        return;
      }
      const res = await action();
      if (session.mode === 'remote') setRemoteProjectMissingBanner(false);
      setResultTitle(label);
      setResultPayload(res);
      setLatestCurl(curlCommand ?? '');
      writeOpMemo(cacheKey, { payload: res, title: label, curl: curlCommand ?? '' });
    } catch (err) {
      if (session.mode === 'remote' && activeZipFile && isWorkerProjectNotFoundError(err)) {
        setRemoteProjectMissingBanner(true);
      }
      setResultTitle(`${label} error`);
      setResultPayload({ message: err instanceof Error ? err.message : String(err) });
      setLatestCurl(curlCommand ?? '');
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return (
      <div className="page">
        <h1>Workspace</h1>
        <p className="muted">Open a project from Home (zip, folder, or a recent worker project) to run read-only operations here.</p>
        <button type="button" className="primary" onClick={() => navigateHash('/')}>
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="page page--workspace">
      <div className="workspace-head">
        <div>
          <h1>Workspace</h1>
          <p className="muted">
            {session.label ? (
              <>
                <strong>{session.label}</strong>
                {' · '}
              </>
            ) : null}
            {isLocal
              ? 'In-tab workspace — one parsed project snapshot powers every action until you reprocess or leave.'
              : `Worker workspace · project ${projectId} — one server snapshot powers read-only actions until re-upload or eviction.`}
          </p>
        </div>
        <button type="button" className="danger ghost" onClick={() => onSessionChange(null)}>
          Clear session
        </button>
      </div>

      {isRemote && remoteProjectMissingBanner ? (
        <section className="panel workspace-stale-banner" aria-live="polite">
          <p className="workspace-stale-banner__title">
            <strong>Project missing on the worker.</strong> It may have been evicted or the worker restarted. Re-upload the same zip to keep your
            workspace context, or open a cached copy from Home.
          </p>
          <div className="row" style={{ marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              className="primary"
              disabled={busy || !activeZipFile}
              onClick={() => void recoverRemoteProjectAfterEviction()}
            >
              Re-upload active zip
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => setRemoteProjectMissingBanner(false)}>
              Dismiss
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => navigateHash('/')}>
              Go to Home (recent zips)
            </button>
          </div>
          {!activeZipFile ? <p className="muted" style={{ marginTop: 8 }}>No zip is attached to this session — reopen from Home.</p> : null}
        </section>
      ) : null}

      <Config
        isRemote={isRemote}
        busy={busy}
        activeZipFile={activeZipFile}
        configJson={configJson}
        onConfigJsonChange={setConfigJson}
        configHint={configHint}
        overrideApplied={overrideApplied}
        latestUploadMeta={latestUploadMeta}
        onReprocess={() =>
          void runAction('Reprocess with config override', async () => {
            if (!configHint.ok) throw new Error(configHint.message);
            await applyConfigOverride(configJson.trim() || undefined);
            setOverrideApplied(true);
            return { ok: true };
          }, isRemote
            ? `curl -sS -X POST "${workerBaseUrl.replace(/\/$/, '')}/v1/projects" -F "archive=@<cached-zip>.zip;type=application/zip"`
            : '')
        }
        onClearOverride={async () => {
          await applyConfigOverride(undefined);
          setConfigJson('');
          setOverrideApplied(false);
        }}
      />

      <Operations
        busy={busy}
        session={session}
        projectId={projectId}
        workerBaseUrl={workerBaseUrl}
        missingTargetTag={missingTargetTag}
        onMissingTargetTagChange={setMissingTargetTag}
        localeTag={localeTag}
        onLocaleTagChange={setLocaleTag}
        runAction={runAction}
        onRemoteProjectDeleted={() => onSessionChange(null)}
        lastOpTitle={resultTitle}
        lastOpPayload={resultPayload}
      />

      <Result
        resultTitle={resultTitle}
        responseDataForViewer={responseDataForViewer}
        workspaceIssues={workspaceIssues}
        projectId={projectId}
        latestCurl={latestCurl}
      />
    </div>
  );
}
