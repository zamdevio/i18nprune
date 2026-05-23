import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ProjectIngestMode } from '../types/index.js';
import { buildLocalProjectFromZip, mergeConfigJsonOntoZipBase } from '../project/index.js';
import { saveRecentProjectZip } from '../storage/index.js';
import { checkWorkerHealth, uploadProjectToWorker } from '../worker/index.js';
import { filesToZipBytes } from '../zip/index.js';
import type { WorkspaceSession } from '@i18nprune/core';

type Props = {
  open: boolean;
  initialFiles: File[];
  defaultWorkerUrl: string;
  preferredMode?: 'local' | 'remote';
  onClose: () => void;
  onComplete: (session: WorkspaceSession) => void;
};

export function OpenProjectPanel({ open, initialFiles, defaultWorkerUrl, preferredMode, onClose, onComplete }: Props) {
  const [mode, setMode] = useState<'local' | 'remote' | null>(null);
  const [remoteIngest, setRemoteIngest] = useState<ProjectIngestMode>('prepared');
  const [workerUrl, setWorkerUrl] = useState(defaultWorkerUrl);
  const [configJson, setConfigJson] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [preparedZipBytes, setPreparedZipBytes] = useState<Uint8Array | null>(null);
  const [preparingZip, setPreparingZip] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(preferredMode ?? null);
    setRemoteIngest('prepared');
    setError(null);
    setHealthOk(null);
    setConfigJson('');
    setBusy(false);
    setWorkerUrl(defaultWorkerUrl);
    setPreparedZipBytes(null);
    setPreparingZip(false);
  }, [open, defaultWorkerUrl, preferredMode]);

  const isFolder = initialFiles.some((f) => Boolean((f as File & { webkitRelativePath?: string }).webkitRelativePath));
  const primaryName =
    initialFiles.length === 1
      ? initialFiles[0]!.name
      : isFolder
        ? `${initialFiles[0]!.webkitRelativePath?.split('/')[0] ?? 'folder'}.zip`
        : 'project.zip';

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      setPreparingZip(true);
      setError(null);
      try {
        let bytes: Uint8Array;
        if (isFolder || initialFiles.length > 1 || !initialFiles[0]!.name.toLowerCase().endsWith('.zip')) {
          bytes = await filesToZipBytes(initialFiles);
        } else {
          bytes = new Uint8Array(await initialFiles[0]!.arrayBuffer());
        }
        if (!cancelled) setPreparedZipBytes(bytes);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setPreparingZip(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, initialFiles, isFolder]);

  if (!open) return null;

  async function testHealth(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const r = await checkWorkerHealth(workerUrl);
      setHealthOk(r.ok);
      if (!r.ok) setError(r.message);
    } catch (e) {
      setHealthOk(false);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function runProcess(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const zipBytes = preparedZipBytes;
      if (!zipBytes) throw new Error('Preparing project bundle. Please wait a moment and retry.');

      const cfg = configJson.trim().length > 0 ? configJson : undefined;
      const mergedCheck = mergeConfigJsonOntoZipBase(zipBytes, cfg);
      if (!mergedCheck.ok) {
        throw new Error(mergedCheck.message);
      }

      const zipBlob = new Blob([new Uint8Array(zipBytes)], { type: 'application/zip' });
      const zipFile = new File([zipBlob], primaryName.toLowerCase().endsWith('.zip') ? primaryName : `${primaryName}.zip`, {
        type: 'application/zip',
      });

      if (mode === 'local') {
        const local = await buildLocalProjectFromZip(zipBytes, { configJson: cfg });
        try {
          await saveRecentProjectZip(zipFile);
        } catch {
          /* cache disabled, quota, or oversize — workspace still opens */
        }
        onComplete({ mode: 'local', local, activeZipFile: zipFile, label: primaryName });
        resetAndClose();
        return;
      }

      if (mode === 'remote') {
        const h = await checkWorkerHealth(workerUrl);
        if (!h.ok) {
          setError(h.ok === false ? h.message : 'Health check failed');
          setHealthOk(false);
          return;
        }
        setHealthOk(true);

        const uploaded = await uploadProjectToWorker({
          workerBaseUrl: workerUrl.trim(),
          zipBytes,
          zipFileName: zipFile.name,
          configJson: cfg,
          ingestMode: remoteIngest,
        });
        if (!uploaded.ok) {
          setError(uploaded.issue.message);
          return;
        }

        try {
          await saveRecentProjectZip(zipFile);
        } catch {
          /* cache disabled, quota, or oversize — workspace still opens */
        }
        onComplete({
          mode: 'remote',
          workerBaseUrl: workerUrl.trim(),
          projectId: uploaded.projectId,
          activeZipFile: zipFile,
          label: primaryName,
          uploadMeta: uploaded.uploadMeta,
        });
        resetAndClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function resetAndClose(): void {
    setMode(null);
    setRemoteIngest('prepared');
    setError(null);
    setHealthOk(null);
    setConfigJson('');
    setWorkerUrl(defaultWorkerUrl);
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal aria-labelledby="open-project-title">
        <div className="modal-panel__head">
          <h2 id="open-project-title">Process project</h2>
          <button type="button" className="runtime-header__icon-btn" disabled={busy} onClick={() => !busy && onClose()} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="muted modal-panel__hint">
          {primaryName}
          {isFolder
            ? ' — folder is zipped in the browser; paths under node_modules, .git, dist, build, out, .next, coverage, and similar are skipped to save bandwidth.'
            : ''}
        </p>
        {preparingZip ? <p className="status-pill status-pill--warn">Building zip bundle for this session…</p> : null}

        <div className="modal-panel__section">
          <span className="field-label">Where to process</span>
          <div className="mode-pills">
            <button type="button" className={mode === 'local' ? 'primary' : ''} disabled={busy} onClick={() => setMode('local')}>
              In browser (local)
            </button>
            <button type="button" className={mode === 'remote' ? 'primary' : ''} disabled={busy} onClick={() => setMode('remote')}>
              Remote worker
            </button>
          </div>
          <p className="muted" style={{ marginTop: 8, fontSize: '0.9rem' }}>
            Local and remote both use the same core prepare pipeline (parse zip → extract keys/locales). Remote upload defaults to
            prepared JSON ingest (like <code>i18nprune share upload --project</code>).
          </p>
        </div>

        {mode === 'remote' ? (
          <>
            <div className="modal-panel__section">
              <span className="field-label">Worker upload mode</span>
              <div className="mode-pills">
                <button
                  type="button"
                  className={remoteIngest === 'prepared' ? 'primary' : ''}
                  disabled={busy}
                  onClick={() => setRemoteIngest('prepared')}
                >
                  Prepared JSON (default)
                </button>
                <button
                  type="button"
                  className={remoteIngest === 'archive' ? 'primary' : ''}
                  disabled={busy}
                  onClick={() => setRemoteIngest('archive')}
                >
                  Archive zip only
                </button>
              </div>
              <p className="muted" style={{ marginTop: 8, fontSize: '0.9rem' }}>
                {remoteIngest === 'prepared'
                  ? 'Prepare in the browser, then POST application/json to /v1/projects (smaller worker CPU, same snapshot shape as CLI).'
                  : 'Send the zip to POST /v1/projects/archive — the worker runs prepare on the edge (no browser extraction before upload).'}
              </p>
            </div>
            <div className="modal-panel__section">
              <label className="field">
                Worker base URL
                <input
                  value={workerUrl}
                  onChange={(e) => setWorkerUrl(e.target.value)}
                  disabled={busy}
                  placeholder="https://worker.i18nprune.dev"
                />
              </label>
              <div className="row" style={{ marginTop: 8 }}>
                <button type="button" disabled={busy} onClick={() => void testHealth()}>
                  Test /health
                </button>
                {healthOk === true ? <span className="ok-pill">Reachable</span> : null}
                {healthOk === false ? <span className="warn-pill">Unreachable</span> : null}
              </div>
            </div>
          </>
        ) : null}

        <div className="modal-panel__section">
          <label className="field field-wide">
            Optional configJson (partial merge onto zip config)
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              disabled={busy}
              placeholder='{"locales":{"source":"locales/en.json","directory":"locales"}} — merged with i18nprune.config from the zip'
            />
          </label>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="modal-panel__foot">
          <button type="button" disabled={busy} onClick={() => !busy && onClose()}>
            Cancel
          </button>
          <button type="button" className="primary" disabled={busy || preparingZip || !preparedZipBytes || !mode} onClick={() => void runProcess()}>
            {busy
              ? 'Working…'
              : mode === 'remote'
                ? remoteIngest === 'prepared'
                  ? 'Prepare + upload'
                  : 'Upload archive'
                : 'Prepare + open'}
          </button>
        </div>
      </div>
    </div>
  );
}
