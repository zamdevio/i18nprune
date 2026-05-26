import { useState } from 'react';
import { getDocsUrl } from '@i18nprune/core';
import type { ProjectReportDocument } from '../../types/index.js';
import { useReportSession, type ReportLoadSource } from '../../context/report/index.js';
import { readWorkerUrl } from '../../storage/workerUrl.js';
import { shareRemoteReportLinkOnly, shareReportUpload } from '../../worker/index.js';

type Props = {
  doc: ProjectReportDocument;
  source: ReportLoadSource;
  workerReportId: string | null;
};

export function ShareReportButton({ doc, source, workerReportId }: Props): JSX.Element {
  const { bindWorkerReport } = useReportSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [humanLines, setHumanLines] = useState<string[]>([]);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const linkOnly = source === 'worker' && workerReportId !== null;

  async function copyToClipboard(target: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      setError('Could not copy to clipboard.');
      return false;
    }
  }

  async function runShare(): Promise<void> {
    setBusy(true);
    setError(null);
    setHumanLines([]);
    setLink(null);
    setCopied(false);
    try {
      const workerBaseUrl = readWorkerUrl();
      if (linkOnly && workerReportId) {
        const outcome = shareRemoteReportLinkOnly({ workerBaseUrl, reportId: workerReportId });
        if (!outcome.ok) {
          setError(outcome.issue.message);
          setHumanLines(outcome.humanLines);
          setOpen(true);
          return;
        }
        setLink(outcome.link);
        setHumanLines(outcome.humanLines);
        setOpen(true);
        return;
      }

      const uploaded = await shareReportUpload({ workerBaseUrl, document: doc });
      if (!uploaded.ok) {
        setError(uploaded.issue.message);
        setHumanLines(uploaded.humanLines);
        setOpen(true);
        return;
      }
      bindWorkerReport(uploaded.reportId);
      setLink(uploaded.link);
      setHumanLines(uploaded.humanLines);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn-secondary share-report-trigger"
        disabled={busy}
        title={linkOnly ? 'Copy hosted report share link' : 'Upload report JSON to the worker and copy share link'}
        onClick={() => void runShare()}
      >
        {busy ? 'Sharing…' : linkOnly ? 'Copy link' : 'Share'}
      </button>

      {open ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="modal share-report-modal"
            role="dialog"
            aria-labelledby="share-report-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="share-report-title">{linkOnly ? 'Report share link' : 'Share report'}</h2>
            {error ? <p className="share-panel__error">{error}</p> : null}
            {link ?
              <p className="mono share-report-modal__link">{link}</p>
            : null}
            {humanLines.length > 0 ?
              <ul className="share-report-modal__lines">
                {humanLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            : null}
            <div className="share-panel__actions">
              {link ?
                <button type="button" className="btn-primary" onClick={() => void copyToClipboard(link)}>
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              : null}
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Close
              </button>
              <a className="share-panel__docs" href={getDocsUrl('commands/share/README')} target="_blank" rel="noopener noreferrer">
                Share docs
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
