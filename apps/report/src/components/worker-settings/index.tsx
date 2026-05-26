import { useEffect, useState } from 'react';
import { DEFAULT_WORKER_API_URL } from '@i18nprune/core';
import { readWorkerUrl, resetWorkerUrlToDefault, writeWorkerUrl } from '../../storage/workerUrl.js';
import { workerFetchJson } from '../../worker/index.js';

export function WorkerUrlSettings(): JSX.Element {
  const [workerUrl, setWorkerUrl] = useState(() => readWorkerUrl());
  const [health, setHealth] = useState<'idle' | 'ok' | 'fail'>('idle');

  useEffect(() => {
    writeWorkerUrl(workerUrl);
  }, [workerUrl]);

  async function checkHealth(): Promise<void> {
    setHealth('idle');
    const base = workerUrl.replace(/\/$/, '');
    const { httpStatus } = await workerFetchJson(`${base}/health`);
    setHealth(httpStatus >= 200 && httpStatus < 300 ? 'ok' : 'fail');
  }

  return (
    <details className="worker-settings">
      <summary className="worker-settings__summary">Worker URL (share &amp; hosted reports)</summary>
      <div className="worker-settings__body">
        <p className="muted">
          Used for <strong>Open shared report</strong>, deep links <code className="mono">#/?id=</code>, and uploads.
          Saved in this browser only.
        </p>
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
          {health === 'fail' ? <span className="status-pill status-pill--warn">Worker unreachable</span> : null}
        </div>
      </div>
    </details>
  );
}
