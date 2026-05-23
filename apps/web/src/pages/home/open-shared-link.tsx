import { useState } from 'react';
import { Link2, SearchCheck } from 'lucide-react';
import { navigateWorkspace } from '../../hooks/useAppRoute.js';
import { ECOSYSTEM_LINKS } from '../../constants/index.js';
import { readWorkerUrl } from '../../storage/index.js';
import { fetchWorkerProjectMetadata, parseWorkspaceProjectId } from '../../worker/index.js';

type CheckState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'valid'; projectId: string; detail: string }
  | { kind: 'invalid'; message: string }
  | { kind: 'parse-error'; message: string };

export function OpenSharedLinkPanel() {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [check, setCheck] = useState<CheckState>({ kind: 'idle' });

  function resetCheck(): void {
    setCheck({ kind: 'idle' });
    setError(null);
  }

  function openLink(): void {
    const id = parseWorkspaceProjectId(draft);
    if (!id) {
      setError('Paste a full share URL or a 16-character worker project id.');
      setCheck({ kind: 'parse-error', message: 'Could not parse a project id from that input.' });
      return;
    }
    resetCheck();
    navigateWorkspace(id);
  }

  async function checkLink(): Promise<void> {
    const id = parseWorkspaceProjectId(draft);
    if (!id) {
      setCheck({ kind: 'parse-error', message: 'Could not parse a project id from that input.' });
      setError('Paste a full share URL or a 16-character worker project id.');
      return;
    }
    setError(null);
    setCheck({ kind: 'checking' });
    const meta = await fetchWorkerProjectMetadata(readWorkerUrl(), id);
    if (!meta.ok) {
      setCheck({ kind: 'invalid', message: meta.issue.message });
      return;
    }
    const data = meta.data as { preparedAt?: string; uploadedAt?: string; projectId?: string } | null;
    const preparedIso = data?.preparedAt ?? data?.uploadedAt;
    const preparedLabel = preparedIso ? new Date(preparedIso).toLocaleString() : null;
    setCheck({
      kind: 'valid',
      projectId: data?.projectId ?? id,
      detail: preparedLabel ? `Found on worker · prepared ${preparedLabel}` : 'Found on worker · metadata OK',
    });
  }

  const checking = check.kind === 'checking';

  return (
    <section className="panel open-shared-link">
      <h2 className="open-shared-link__title">
        <Link2 size={18} aria-hidden className="open-shared-link__icon" />
        Open shared project
      </h2>
      <p className="muted">
        Paste a link like <code>#/workspace?id=…</code> from <strong>Copy link</strong> in the workspace. The id stays in
        the URL on reload.
      </p>
      <label className="field field-wide">
        Share URL or project id
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            resetCheck();
          }}
          placeholder="https://web.i18nprune.dev/#/workspace?id=…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void checkLink();
          }}
        />
      </label>
      {error ? <p className="error-text">{error}</p> : null}
      {check.kind === 'checking' ? (
        <p className="status-pill open-shared-link__status">Checking worker metadata…</p>
      ) : null}
      {check.kind === 'valid' ? (
        <p className="ok-pill open-shared-link__status" role="status">
          Valid · <code>{check.projectId}</code> — {check.detail}
        </p>
      ) : null}
      {check.kind === 'invalid' || check.kind === 'parse-error' ? (
        <p className="warn-pill open-shared-link__status" role="status">
          {check.message}
        </p>
      ) : null}
      <div className="row open-shared-link__actions">
        <button type="button" className="ghost" disabled={checking || !draft.trim()} onClick={() => void checkLink()}>
          <SearchCheck size={16} aria-hidden style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Check link
        </button>
        <button
          type="button"
          className="primary"
          disabled={checking || !parseWorkspaceProjectId(draft)}
          onClick={openLink}
        >
          Open in workspace
        </button>
        <a className="btn-link" href={ECOSYSTEM_LINKS.docsShare.href} target="_blank" rel="noopener noreferrer">
          Share docs
        </a>
      </div>
      <p className="muted open-shared-link__hint">
        <strong>Check link</strong> calls the worker metadata endpoint (same probe as opening). <strong>Open</strong> needs a
        parseable id or URL.
      </p>
    </section>
  );
}
