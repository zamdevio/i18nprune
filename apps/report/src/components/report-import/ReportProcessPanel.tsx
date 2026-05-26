import { useEffect, useState } from 'react';
import { prepareReportDocumentFromZip } from '../../lib/share/prepareReportFromZip.js';
import { readWorkerUrl } from '../../storage/workerUrl.js';
import { checkWorkerHealth, shareReportArchiveUpload, shareReportUpload } from '../../worker/index.js';
import type { ProjectReportDocument } from '../../types/index.js';

export type ReportIngestMode = 'prepared' | 'archive';

type Props = {
  open: boolean;
  initialFile: File;
  onClose: () => void;
  onLocalComplete: (doc: ProjectReportDocument) => void;
  onRemotePreparedComplete: (input: { doc: ProjectReportDocument; reportId: string; link: string }) => void;
  onRemoteArchiveComplete: (input: { reportId: string; link: string; humanLines: string[] }) => void;
  onRemoteError: (message: string, humanLines: string[]) => void;
};

export function ReportProcessPanel({
  open,
  initialFile,
  onClose,
  onLocalComplete,
  onRemotePreparedComplete,
  onRemoteArchiveComplete,
  onRemoteError,
}: Props): JSX.Element | null {
  const [mode, setMode] = useState<'local' | 'remote' | null>(null);
  const [remoteIngest, setRemoteIngest] = useState<ReportIngestMode>('prepared');
  const [workerUrl, setWorkerUrl] = useState(() => readWorkerUrl());
  const [configJson, setConfigJson] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [zipBytes, setZipBytes] = useState<Uint8Array | null>(null);
  const [preparingZip, setPreparingZip] = useState(false);

  const primaryName = initialFile.name.toLowerCase().endsWith('.zip') ? initialFile.name : `${initialFile.name}.zip`;

  useEffect(() => {
    if (!open) return;
    setMode(null);
    setRemoteIngest('prepared');
    setError(null);
    setHealthOk(null);
    setConfigJson('');
    setBusy(false);
    setWorkerUrl(readWorkerUrl());
    setZipBytes(null);
    setPreparingZip(false);
  }, [open, initialFile]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      setPreparingZip(true);
      setError(null);
      try {
        const bytes = new Uint8Array(await initialFile.arrayBuffer());
        if (!cancelled) setZipBytes(bytes);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setPreparingZip(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, initialFile]);

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
      if (!zipBytes) throw new Error('Preparing project bundle. Please wait a moment and retry.');
      const cfg = configJson.trim().length > 0 ? configJson : undefined;

      if (mode === 'local') {
        const doc = await prepareReportDocumentFromZip(zipBytes, { configJson: cfg });
        onLocalComplete(doc);
        onClose();
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

        if (remoteIngest === 'archive') {
          const uploaded = await shareReportArchiveUpload({
            workerBaseUrl: workerUrl.trim(),
            zipBytes,
            zipFileName: primaryName,
            configJson: cfg,
          });
          if (!uploaded.ok) {
            onRemoteError(uploaded.issue.message, uploaded.humanLines);
            return;
          }
          onRemoteArchiveComplete({
            reportId: uploaded.reportId,
            link: uploaded.link,
            humanLines: uploaded.humanLines,
          });
          onClose();
          return;
        }

        const doc = await prepareReportDocumentFromZip(zipBytes, { configJson: cfg });
        const uploaded = await shareReportUpload({ workerBaseUrl: workerUrl.trim(), document: doc });
        if (!uploaded.ok) {
          onRemoteError(uploaded.issue.message, uploaded.humanLines);
          return;
        }
        onRemotePreparedComplete({ doc, reportId: uploaded.reportId, link: uploaded.link });
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal aria-labelledby="report-process-title">
        <div className="modal-panel__head">
          <h2 id="report-process-title">Process report</h2>
          <button
            type="button"
            className="runtime-header__icon-btn"
            disabled={busy}
            onClick={() => !busy && onClose()}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="muted modal-panel__hint">{primaryName}</p>
        {preparingZip ? <p className="status-pill status-pill--warn">Reading zip bundle…</p> : null}

        <div className="modal-panel__section">
          <span className="field-label">Where to process</span>
          <div className="mode-pills">
            <button type="button" className={mode === 'local' ? 'btn-primary' : 'btn-secondary'} disabled={busy} onClick={() => setMode('local')}>
              In browser (local)
            </button>
            <button type="button" className={mode === 'remote' ? 'btn-primary' : 'btn-secondary'} disabled={busy} onClick={() => setMode('remote')}>
              Remote worker
            </button>
          </div>
          <p className="muted report-process-panel__hint">
            Local and remote both build a report from the project zip. Remote upload defaults to prepared JSON ingest.
          </p>
        </div>

        {mode === 'remote' ?
          <>
            <div className="modal-panel__section">
              <span className="field-label">Worker upload mode</span>
              <div className="mode-pills">
                <button
                  type="button"
                  className={remoteIngest === 'prepared' ? 'btn-primary' : 'btn-secondary'}
                  disabled={busy}
                  onClick={() => setRemoteIngest('prepared')}
                >
                  Prepared JSON (default)
                </button>
                <button
                  type="button"
                  className={remoteIngest === 'archive' ? 'btn-primary' : 'btn-secondary'}
                  disabled={busy}
                  onClick={() => setRemoteIngest('archive')}
                >
                  Archive zip only
                </button>
              </div>
              <p className="muted report-process-panel__hint">
                {remoteIngest === 'prepared'
                  ? 'Prepare in the browser, then POST application/json to /v1/reports.'
                  : 'Send the zip to POST /v1/reports/archive — the worker runs prepare on the edge.'}
              </p>
            </div>
            <div className="modal-panel__section">
              <label className="field">
                Worker base URL
                <input value={workerUrl} onChange={(e) => setWorkerUrl(e.target.value)} disabled={busy} placeholder="https://worker.i18nprune.dev" />
              </label>
              <div className="row" style={{ marginTop: 8 }}>
                <button type="button" className="btn-secondary" disabled={busy} onClick={() => void testHealth()}>
                  Test /health
                </button>
                {healthOk === true ? <span className="ok-pill">Reachable</span> : null}
                {healthOk === false ? <span className="warn-pill">Unreachable</span> : null}
              </div>
            </div>
          </>
        : null}

        <div className="modal-panel__section">
          <label className="field field-wide">
            Optional configJson (partial merge onto zip config)
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              disabled={busy}
              placeholder='{"locales":{"source":"locales/en.json","directory":"locales"}}'
            />
          </label>
        </div>

        {error ? <p className="share-panel__error">{error}</p> : null}

        <div className="modal-panel__foot">
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => !busy && onClose()}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || preparingZip || !zipBytes || !mode}
            onClick={() => void runProcess()}
          >
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
