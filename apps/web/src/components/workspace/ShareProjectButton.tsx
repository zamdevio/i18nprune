import { useState } from 'react';
import { Copy, Link2 } from 'lucide-react';
import { ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE, type WorkspaceSession } from '@i18nprune/core';
import { buildWebWorkspaceShareUrl } from '../../hooks/useAppRoute';
import { readWorkerUrl } from '../../lib/storage/workerUrl';
import { shareProjectFromSession } from '../../lib/services/share/webShare';

type Props = {
  session: WorkspaceSession;
  workerBaseUrl?: string;
  configJson?: string;
  disabled?: boolean;
};

export function ShareProjectButton({ session, workerBaseUrl, configJson, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [humanLines, setHumanLines] = useState<string[]>([]);
  const [webLink, setWebLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isRemote = session.mode === 'remote';
  const effectiveWorker = (isRemote ? session.workerBaseUrl : workerBaseUrl ?? readWorkerUrl()).trim();

  async function copyToClipboard(link: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      setError('Could not copy to clipboard.');
      return false;
    }
  }

  async function copyRemoteLink(): Promise<void> {
    if (session.mode !== 'remote') return;
    setError(null);
    const link = buildWebWorkspaceShareUrl(session.projectId);
    setWebLink(link);
    await copyToClipboard(link);
  }

  async function runLocalShare(): Promise<void> {
    setBusy(true);
    setError(null);
    setHumanLines([]);
    setWebLink(null);
    setCopied(false);
    try {
      const outcome = await shareProjectFromSession({
        session,
        workerBaseUrl: effectiveWorker,
        configJson,
      });
      setHumanLines(outcome.humanLines);
      if (!outcome.ok) {
        const first = outcome.issues.find((i) => i.severity === 'error');
        setError(first?.message ?? 'Share failed.');
        if (first?.code === ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE) {
          setError(`${first.message} Limits: 50MB zip and worker file-count caps — trim the zip and retry.`);
        }
        return;
      }
      const link = outcome.result.links.web;
      if (link) setWebLink(link);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (isRemote) {
    return (
      <>
        <button
          type="button"
          className="ghost"
          disabled={disabled || busy}
          title="Copy workspace link (project already on worker)"
          onClick={() => void copyRemoteLink()}
        >
          <Copy size={16} aria-hidden />
          <span>{copied ? 'Copied' : busy ? 'Copying…' : 'Copy link'}</span>
        </button>
        {error ? <span className="error-text share-inline-error">{error}</span> : null}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className="ghost"
        disabled={disabled || busy}
        title="Upload snapshot to worker and copy share link"
        onClick={() => void runLocalShare()}
      >
        <Link2 size={16} aria-hidden />
        <span>{busy ? 'Sharing…' : 'Share'}</span>
      </button>

      {error && !open ? <span className="error-text share-inline-error">{error}</span> : null}

      {open ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel share-modal" role="dialog" aria-modal aria-labelledby="share-project-title">
            <div className="modal-panel__head">
              <h2 id="share-project-title">Project share link</h2>
              <button type="button" className="runtime-header__icon-btn" disabled={busy} onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            {humanLines.length > 0 ? (
              <ul className="share-modal__manifest">
                {humanLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
            {webLink ? (
              <label className="field field-wide">
                Web link
                <input readOnly value={webLink} onFocus={(e) => e.target.select()} />
              </label>
            ) : null}
            {error ? <p className="error-text">{error}</p> : null}
            <p className="muted modal-panel__hint">Links expire after ~7 days without reads on the worker. Reload keeps the same project id in the URL.</p>
            <div className="modal-panel__foot">
              <button type="button" disabled={!webLink} onClick={() => webLink && void copyToClipboard(webLink)}>
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <button type="button" className="primary" onClick={() => setOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
