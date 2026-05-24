import { useEffect, useRef, useState } from 'react';
import { DeleteConfirmButton } from '../../components/ui/delete';
import { ToolbarDropdown } from '@i18nprune/ui/react/toolbar';
import { DEFAULT_WORKER_API_URL } from '@i18nprune/core';
import { ECOSYSTEM_LINKS } from '../../constants/index.js';
import {
  clearRecentProjectZips,
  exportRecentProjectZipBundle,
  getRecentProjectZipStats,
  importRecentProjectZipBundle,
  readRecentProjectZipSettings,
  summarizeTrimPreview,
  updateRecentProjectZipSettings,
  validateRecentProjectZipBundle,
  readWorkerUrl,
  resetWorkerUrlToDefault,
  writeWorkerUrl,
} from '../../storage/index.js';
import { checkWorkerHealth, invalidateWorkerGate } from '../../worker/index.js';

export function SettingsPage() {
  const initialRecent = readRecentProjectZipSettings();
  const [workerUrl, setWorkerUrl] = useState(() => readWorkerUrl());
  const [recentSettings, setRecentSettings] = useState(initialRecent);
  const [recentMaxDraft, setRecentMaxDraft] = useState(String(initialRecent.maxCount));
  const [recentQuotaMbDraft, setRecentQuotaMbDraft] = useState(String(initialRecent.maxTotalMb));
  const [health, setHealth] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [busy, setBusy] = useState(false);
  const [workerStatus, setWorkerStatus] = useState<{ kind: 'ok' | 'warn' | 'error'; text: string } | null>(null);
  const [recentStatus, setRecentStatus] = useState<{ kind: 'ok' | 'warn' | 'error'; text: string } | null>(null);
  const [importPanelOpen, setImportPanelOpen] = useState(false);
  const [importDropDepth, setImportDropDepth] = useState(0);
  const [importInspecting, setImportInspecting] = useState(false);
  const [importPreview, setImportPreview] = useState<{ file: File; summary: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [savingWorker, setSavingWorker] = useState(false);
  const [savingRecent, setSavingRecent] = useState(false);

  const stats = getRecentProjectZipStats();
  const nextMax = Number.parseInt(recentMaxDraft, 10);
  const trimPreview = summarizeTrimPreview(Number.isFinite(nextMax) ? nextMax : recentSettings.maxCount);
  const trimNeeded = trimPreview.totalDelete > 0 && Number.isFinite(nextMax) && nextMax < recentSettings.maxCount;

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSavingWorker(true);
      writeWorkerUrl(workerUrl);
      invalidateWorkerGate();
      setSavingWorker(false);
    }, 300);
    return () => window.clearTimeout(t);
  }, [workerUrl]);

  useEffect(() => {
    if (trimNeeded) return;
    const t = window.setTimeout(() => {
      setSavingRecent(true);
      void saveRecentSettings()
        .catch((e) => setRecentStatus({ kind: 'error', text: e instanceof Error ? e.message : String(e) }))
        .finally(() => setSavingRecent(false));
    }, 350);
    return () => window.clearTimeout(t);
  }, [
    recentSettings.enabled,
    recentSettings.defaultMode,
    recentMaxDraft,
    recentQuotaMbDraft,
    trimNeeded,
  ]);

  async function testHealth(): Promise<void> {
    setBusy(true);
    setWorkerStatus(null);
    try {
      const r = await checkWorkerHealth(workerUrl);
      if (r.ok) {
        setHealth('ok');
        setWorkerStatus({ kind: 'ok', text: 'Worker responded successfully.' });
      } else {
        setHealth('fail');
        setWorkerStatus({ kind: 'error', text: r.message });
      }
    } catch (e) {
      setHealth('fail');
      setWorkerStatus({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function saveRecentSettings(): Promise<void> {
    const maxRaw = Number.parseInt(recentMaxDraft, 10);
    const quotaRaw = Number.parseInt(recentQuotaMbDraft, 10);
    const next = await updateRecentProjectZipSettings({
      enabled: recentSettings.enabled,
      defaultMode: recentSettings.defaultMode,
      maxCount: Number.isFinite(maxRaw) ? maxRaw : recentSettings.maxCount,
      maxTotalMb: Number.isFinite(quotaRaw) ? quotaRaw : recentSettings.maxTotalMb,
    });
    setRecentSettings(next);
    setRecentMaxDraft(String(next.maxCount));
    setRecentQuotaMbDraft(String(next.maxTotalMb));
  }

  async function purgeRecentZips(): Promise<void> {
    await clearRecentProjectZips();
    setRecentSettings(readRecentProjectZipSettings());
    setRecentStatus({ kind: 'warn', text: 'All cached recent project zips were deleted.' });
  }

  async function exportBundle(): Promise<void> {
    const file = await exportRecentProjectZipBundle();
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    setRecentStatus({ kind: 'ok', text: `Export saved as ${file.name} (manifest.json + zips/).` });
  }

  async function importBundle(file: File): Promise<void> {
    setImportError(null);
    setImportInspecting(true);
    const validation = await validateRecentProjectZipBundle(file);
    if (!validation.ok) {
      setImportPreview(null);
      setImportError(validation.message);
      setImportInspecting(false);
      return;
    }
    setImportPreview({
      file,
      summary: `${String(validation.zipCount)} zip(s) · exported ${new Date(validation.manifest.exportedAt).toLocaleString()}`,
    });
    setImportInspecting(false);
  }

  async function confirmImport(): Promise<void> {
    if (!importPreview) return;
    const res = await importRecentProjectZipBundle(importPreview.file);
    setRecentSettings(readRecentProjectZipSettings());
    setImportPreview(null);
    setImportPanelOpen(false);
    setRecentStatus({ kind: 'ok', text: `Imported ${String(res.imported)} zip(s).` });
  }

  const workerStatusClass =
    workerStatus?.kind === 'ok'
      ? 'status-pill status-pill--ok'
      : workerStatus?.kind === 'error'
        ? 'status-pill status-pill--error'
        : 'status-pill status-pill--warn';
  const recentStatusClass =
    recentStatus?.kind === 'ok'
      ? 'status-pill status-pill--ok'
      : recentStatus?.kind === 'error'
        ? 'status-pill status-pill--error'
        : 'status-pill status-pill--warn';

  return (
    <div className="page">
      <h1>Settings</h1>
      <p className="muted">
        Worker URL and recent project cache settings are auto-saved locally. Share links use this worker with the hosted
        web app — see{' '}
        <a href={ECOSYSTEM_LINKS.docsShare.href} target="_blank" rel="noopener noreferrer">
          share docs
        </a>
        .
      </p>

      <section className="panel">
        <h2>Remote project cache</h2>
        <p className="muted">
          The worker stores each upload in a Durable Object. Rows are kept for <strong>7 days after the last successful read</strong>{' '}
          (metadata, validate, snapshot, etc. all count). Any request that loads the project bumps <code>lastAccessedAt</code>, and a
          background sweep removes idle projects so forgotten uploads do not hold large JSON forever.
        </p>
      </section>

      <section className="panel">
        <h2>Worker URL</h2>
        <label className="field field-wide">
          Default base URL
          <input value={workerUrl} onChange={(e) => setWorkerUrl(e.target.value)} placeholder="https://worker.i18nprune.dev" />
        </label>
        <div className="row" style={{ marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
          <button type="button" disabled={busy} onClick={() => void testHealth()}>
            Test /health
          </button>
          <button
            type="button"
            className="ghost"
            disabled={busy || workerUrl.trim() === DEFAULT_WORKER_API_URL}
            onClick={() => {
              setWorkerUrl(resetWorkerUrlToDefault());
              setHealth('idle');
              setWorkerStatus(null);
            }}
          >
            Reset to default
          </button>
          {savingWorker ? <span className="status-pill status-pill--warn">Saving URL…</span> : null}
          {health === 'ok' ? <span className="ok-pill">OK</span> : null}
          {health === 'fail' ? <span className="warn-pill">Failed</span> : null}
        </div>
        {workerStatus ? <p className={workerStatusClass} style={{ marginTop: 10 }}>{workerStatus.text}</p> : null}
      </section>

      <section className="panel">
        <h2>Recent project zips (browser storage)</h2>
        <p className="muted">
          Current usage: <strong>{String(stats.count)}</strong> zip(s), <strong>{(stats.totalBytes / 1024 / 1024).toFixed(2)}MB</strong>.
        </p>
        <div className="row">
          <label className="field-inline">
            <span className="switch">
              <input
                type="checkbox"
                checked={recentSettings.enabled}
                onChange={(e) => setRecentSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
              />
              <span className="switch__track" />
            </span>
            Enable recent zip caching
          </label>
          <label className="field-inline">
            <span className="muted">Autosave is enabled</span>
          </label>
        </div>
        <div className="row">
          <label className="field-inline">
            Default mode
            <ToolbarDropdown
              className="toolbar-dropdown--dropup"
              prefix=""
              ariaLabel="Default mode for opening recent zips"
              options={[
                { value: 'ask', label: 'Ask every time (default)' },
                { value: 'local', label: 'Local' },
                { value: 'remote', label: 'Remote' },
              ]}
              value={recentSettings.defaultMode}
              onChange={(mode) => setRecentSettings((prev) => ({ ...prev, defaultMode: mode }))}
            />
          </label>
        </div>
        <div className="row">
          <label className="field-inline">
            Max recent zips
            <input
              type="number"
              min={0}
              max={1000}
              value={recentMaxDraft}
              onChange={(e) => setRecentMaxDraft(e.target.value)}
              style={{ width: 110 }}
            />
          </label>
        </div>
        <div className="row">
          <label className="field-inline">
            Quota MB
            <input
              type="number"
              min={0}
              max={20000}
              value={recentQuotaMbDraft}
              onChange={(e) => setRecentQuotaMbDraft(e.target.value)}
              style={{ width: 110 }}
            />
          </label>
          {trimNeeded ? (
            <DeleteConfirmButton
              title="Apply lower max recent zips?"
              description={`Saving this removes ${String(trimPreview.totalDelete)} oldest cached zip(s).`}
              confirmLabel="Apply and delete oldest"
              triggerLabel="Apply max change"
              triggerClassName="primary"
              previewItems={trimPreview.sample}
              previewMoreCount={trimPreview.moreCount}
              onConfirm={saveRecentSettings}
            />
          ) : null}
        </div>
        <div className="row recent-actions-row">
          <DeleteConfirmButton
            title="Purge all cached zips?"
            description="This removes every cached zip from browser storage."
            confirmLabel="Purge all"
            triggerLabel="Purge all cached zips"
            onConfirm={purgeRecentZips}
          />
          <button type="button" onClick={() => void exportBundle()}>
            Export zip cache
          </button>
          <button type="button" onClick={() => setImportPanelOpen((v) => !v)}>
            {importPanelOpen ? 'Close import panel' : 'Import zip cache'}
          </button>
        </div>
        {importPanelOpen ? (
          <div className="import-panel">
            <div
              className={`drop-zone${importDropDepth > 0 ? ' drop-zone--active' : ''}`}
              onDragEnter={(e) => {
                e.preventDefault();
                setImportDropDepth((d) => d + 1);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setImportDropDepth((d) => Math.max(0, d - 1));
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(e) => {
                e.preventDefault();
                setImportDropDepth(0);
                const f = e.dataTransfer.files?.[0];
                if (!f) return;
                if (!f.name.toLowerCase().endsWith('.zip')) {
                  setImportError('Only .zip bundle files are accepted.');
                  return;
                }
                void importBundle(f).catch((err) => setImportError(err instanceof Error ? err.message : String(err)));
              }}
            >
              <p className="drop-zone__title">Drop export zip here</p>
              <p className="muted">
                Same layout as <strong>Export zip cache</strong>: root <code>manifest.json</code> (each entry needs <code>sha256</code>) and a{' '}
                <code>zips/</code> folder with one <code>.zip</code> per entry id. No extra files inside the archive.
              </p>
              <button type="button" onClick={() => importInputRef.current?.click()}>
                Choose .zip file
              </button>
            </div>
            <input
              ref={importInputRef}
              type="file"
              hidden
              accept=".zip,application/zip"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (!f.name.toLowerCase().endsWith('.zip')) {
                    setImportError('Only .zip bundle files are accepted.');
                  } else {
                    void importBundle(f).catch((err) => setImportError(err instanceof Error ? err.message : String(err)));
                  }
                }
                e.target.value = '';
              }}
            />
            {importInspecting ? <p className="status-pill status-pill--warn">Validating manifest.json and zip payloads…</p> : null}
            {importPreview ? (
              <div className="config-validator config-validator--valid">
                <strong>Bundle ready:</strong> {importPreview.file.name} ({importPreview.summary})
                <div style={{ marginTop: 8 }}>
                  <button type="button" className="primary" onClick={() => void confirmImport()}>
                    Confirm import
                  </button>
                </div>
              </div>
            ) : null}
            {importError ? <p className="error-text">{importError}</p> : null}
          </div>
        ) : null}
        {savingRecent ? <p className="status-pill status-pill--warn" style={{ marginTop: 10 }}>Saving recent settings…</p> : null}
        {recentStatus ? <p className={recentStatusClass} style={{ marginTop: 10 }}>{recentStatus.text}</p> : null}
      </section>
    </div>
  );
}
