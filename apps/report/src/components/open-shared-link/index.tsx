import { useState } from 'react';
import { Link2, SearchCheck } from 'lucide-react';
import { getDocsUrl } from '@i18nprune/core';
import { parseReportShareId } from '../../lib/share/parseReportShareId.js';
import { readWorkerUrl } from '../../storage/workerUrl.js';
import { fetchWorkerReportMetadata } from '../../worker/index.js';

type CheckState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'valid'; reportId: string; detail: string }
  | { kind: 'invalid'; message: string }
  | { kind: 'parse-error'; message: string };

export type OpenSharedLinkPanelProps = {
  onOpen: (reportId: string) => void;
};

export function OpenSharedLinkPanel({ onOpen }: OpenSharedLinkPanelProps): JSX.Element {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [check, setCheck] = useState<CheckState>({ kind: 'idle' });

  function resetCheck(): void {
    setCheck({ kind: 'idle' });
    setError(null);
  }

  function openLink(): void {
    const id = parseReportShareId(draft);
    if (!id) {
      setError('Paste a full share URL or a 16-character worker report id.');
      setCheck({ kind: 'parse-error', message: 'Could not parse a report id from that input.' });
      return;
    }
    resetCheck();
    onOpen(id);
  }

  async function checkLink(): Promise<void> {
    const id = parseReportShareId(draft);
    if (!id) {
      setCheck({ kind: 'parse-error', message: 'Could not parse a report id from that input.' });
      setError('Paste a full share URL or a 16-character worker report id.');
      return;
    }
    setError(null);
    setCheck({ kind: 'checking' });
    const meta = await fetchWorkerReportMetadata(readWorkerUrl(), id);
    if (!meta.ok) {
      setCheck({ kind: 'invalid', message: meta.issue.message });
      return;
    }
    const data = meta.data as { generatedAt?: string; uploadedAt?: string; reportId?: string } | null;
    const preparedIso = data?.generatedAt ?? data?.uploadedAt;
    const preparedLabel = preparedIso ? new Date(preparedIso).toLocaleString() : null;
    setCheck({
      kind: 'valid',
      reportId: data?.reportId ?? id,
      detail: preparedLabel ? `Found on worker · generated ${preparedLabel}` : 'Found on worker · metadata OK',
    });
  }

  const checking = check.kind === 'checking';

  return (
    <section className="panel open-shared-link">
      <h2 className="open-shared-link__title">
        <Link2 size={18} aria-hidden className="open-shared-link__icon" />
        Open shared report
      </h2>
      <p className="muted">
        Paste a link like <code className="mono">#/?id=…</code> from <strong>Copy link</strong> after sharing. The id
        stays in the URL on reload.
      </p>
      <label className="field field-wide">
        Share URL or report id
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            resetCheck();
          }}
          placeholder="https://report.i18nprune.dev/#/?id=…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void checkLink();
          }}
        />
      </label>
      {error ? <p className="error-text">{error}</p> : null}
      {check.kind === 'checking' ?
        <p className="status-pill open-shared-link__status">Checking worker metadata…</p>
      : null}
      {check.kind === 'valid' ?
        <p className="ok-pill open-shared-link__status" role="status">
          Valid · <code className="mono">{check.reportId}</code> — {check.detail}
        </p>
      : null}
      {check.kind === 'invalid' || check.kind === 'parse-error' ?
        <p className="warn-pill open-shared-link__status" role="status">
          {check.message}
        </p>
      : null}
      <div className="row open-shared-link__actions">
        <button type="button" className="ghost" disabled={checking || !draft.trim()} onClick={() => void checkLink()}>
          <SearchCheck size={16} aria-hidden style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Check link
        </button>
        <button
          type="button"
          className="primary"
          disabled={checking || !parseReportShareId(draft)}
          onClick={openLink}
        >
          Open report
        </button>
        <a className="btn-link" href={getDocsUrl('commands/share/README')} target="_blank" rel="noopener noreferrer">
          Share docs
        </a>
      </div>
      <p className="muted open-shared-link__hint">
        <strong>Check link</strong> calls the worker metadata endpoint (same probe as opening). <strong>Open</strong>{' '}
        needs a parseable id or URL.
      </p>
    </section>
  );
}
