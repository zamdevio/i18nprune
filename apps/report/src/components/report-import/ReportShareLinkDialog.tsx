import { useMemo, useState } from 'react';
import { getDocsUrl } from '@i18nprune/core';
import { toast } from '@i18nprune/ui/react/feedback';
import { resolveCopyShareLink } from '../../lib/share/reportShareUrl.js';

export type ReportShareLinkDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Worker/upload link (may use a stale base); prefer {@link reportId} for copy UI. */
  link: string | null;
  /** When set, copy/open URL uses `origin/#/?id=` on the current report app. */
  reportId?: string | null;
  humanLines: string[];
  error: string | null;
  busy?: boolean;
};

export function ReportShareLinkDialog({
  open,
  onClose,
  title = 'Report share link',
  link,
  reportId,
  humanLines,
  error,
  busy = false,
}: ReportShareLinkDialogProps): JSX.Element | null {
  const [copied, setCopied] = useState(false);

  const copyLink = useMemo(
    () => resolveCopyShareLink({ reportId, link }),
    [reportId, link],
  );

  if (!open) return null;

  async function copyToClipboard(target: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy to clipboard.');
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel share-modal" role="dialog" aria-modal aria-labelledby="report-share-link-title">
        <div className="modal-panel__head">
          <h2 id="report-share-link-title">{title}</h2>
          <button
            type="button"
            className="runtime-header__icon-btn"
            disabled={busy}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {humanLines.length > 0 ?
          <ul className="share-modal__manifest">
            {humanLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        : null}
        {copyLink ?
          <label className="field field-wide">
            Share link
            <input readOnly className="mono" value={copyLink} onFocus={(e) => e.target.select()} />
          </label>
        : null}
        {error ?
          <>
            <p className="share-panel__error">{error}</p>
            <p className="muted modal-panel__hint">
              Prepared ingest limits apply — see{' '}
              <a href={getDocsUrl('commands/share/README')} target="_blank" rel="noopener noreferrer">
                share docs
              </a>
              . Archive-only hosts can use worker archive routes.
            </p>
          </>
        : (
          <p className="muted modal-panel__hint">
            Hosted reports expire after ~7 days without reads on the worker. Share links use this page&apos;s origin
            with <span className="mono">/#/?id=…</span>.{' '}
            <a href={getDocsUrl('commands/share/README')} target="_blank" rel="noopener noreferrer">
              Share docs
            </a>
          </p>
        )}
        <div className="modal-panel__foot">
          {copyLink ?
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void copyToClipboard(copyLink)}>
              {copied ? 'Copied' : 'Copy link'}
            </button>
          : null}
          <button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
