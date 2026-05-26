import { useEffect, useRef, useState } from 'react';
import { DEFAULT_WORKER_API_URL, getDocsUrl } from '@i18nprune/core';
import { toast } from '@i18nprune/ui/react/feedback';
import {
  SHARE_HISTORY_DEFAULT_MAX,
  SHARE_HISTORY_HARD_MAX,
} from '../../constants/shareHistory.js';
import {
  clearShareHistory,
  exportShareHistoryBundle,
  importShareHistoryBundle,
  listShareHistory,
  readReportSettings,
  shareHistoryStats,
  validateShareHistoryExport,
  writeReportSettings,
  writeWorkerUrl,
  readWorkerUrl,
  resetWorkerUrlToDefault,
} from '../../storage/index.js';
import { workerFetchJson } from '../../worker/index.js';

export function SettingsPage(): JSX.Element {
  const initialSettings = readReportSettings();
  const [workerUrl, setWorkerUrl] = useState(() => readWorkerUrl());
  const [maxHistoryDraft, setMaxHistoryDraft] = useState(String(initialSettings.maxHistoryCount));
  const [health, setHealth] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => writeWorkerUrl(workerUrl), 300);
    return () => window.clearTimeout(t);
  }, [workerUrl]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const n = Number.parseInt(maxHistoryDraft, 10);
      if (!Number.isFinite(n)) return;
      writeReportSettings({ maxHistoryCount: n });
    }, 400);
    return () => window.clearTimeout(t);
  }, [maxHistoryDraft]);

  const stats = shareHistoryStats();

  async function checkHealth(): Promise<void> {
    const base = workerUrl.replace(/\/$/, '');
    const { httpStatus } = await workerFetchJson(`${base}/health`);
    setHealth(httpStatus >= 200 && httpStatus < 300 ? 'ok' : 'fail');
  }

  function exportHistory(): void {
    const bundle = exportShareHistoryBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `i18nprune-report-share-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${String(bundle.entries.length)} entries.`);
  }

  async function onImportFile(file: File): Promise<void> {
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = validateShareHistoryExport(JSON.parse(text) as unknown);
      importShareHistoryBundle(parsed, 'replace');
      const settings = readReportSettings();
      setMaxHistoryDraft(String(settings.maxHistoryCount));
      toast.success(
        `Imported ${String(listShareHistory().length)} entries (replaced local history).`,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setImportError(message);
      toast.error(message);
    }
  }

  return (
    <div className="page-shell">
      <h1 className="page-title">Settings</h1>
      <p className="muted page-lead">
        Worker URL, share history limits, and local data export. Values are saved in this browser only.{' '}
        <a href={getDocsUrl('commands/share/README')} target="_blank" rel="noopener noreferrer">
          Share docs
        </a>
      </p>

      <section className="panel settings-section">
        <h2>Worker URL</h2>
        <p className="muted">Used for hosted report links (`#/?id=`) and uploads.</p>
        <label className="field field-wide">
          Worker base URL
          <input
            value={workerUrl}
            onChange={(e) => setWorkerUrl(e.target.value)}
            placeholder="https://worker.i18nprune.dev"
          />
        </label>
        <div className="share-panel__actions">
          <button type="button" className="btn-secondary" onClick={() => void checkHealth()}>
            Check health
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={workerUrl.trim() === DEFAULT_WORKER_API_URL}
            onClick={() => setWorkerUrl(resetWorkerUrlToDefault())}
          >
            Reset default
          </button>
          {health === 'ok' ? <span className="status-pill status-pill--ok">Worker OK</span> : null}
          {health === 'fail' ? <span className="status-pill status-pill--warn">Unreachable</span> : null}
        </div>
      </section>

      <section className="panel settings-section">
        <h2>Share history</h2>
        <p className="muted">
          Stored links: <strong>{stats.count}</strong> / max <strong>{stats.max}</strong> (default{' '}
          {SHARE_HISTORY_DEFAULT_MAX}, hard cap {SHARE_HISTORY_HARD_MAX}).
        </p>
        <label className="field field-wide">
          Max history entries
          <input
            type="number"
            min={1}
            max={SHARE_HISTORY_HARD_MAX}
            value={maxHistoryDraft}
            onChange={(e) => setMaxHistoryDraft(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            clearShareHistory();
            toast.success('Share history cleared.');
          }}
        >
          Clear history
        </button>
      </section>

      <section className="panel settings-section">
        <h2>Export / import</h2>
        <p className="muted">Backup or move share history and settings between browsers.</p>
        <div className="share-panel__actions">
          <button type="button" className="btn-primary" onClick={exportHistory}>
            Export JSON
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="payload-import__file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportFile(f);
              e.target.value = '';
            }}
          />
          <button type="button" className="btn-secondary" onClick={() => importRef.current?.click()}>
            Import JSON (replace)
          </button>
        </div>
        {importError ? <p className="share-panel__error">{importError}</p> : null}
      </section>
    </div>
  );
}
