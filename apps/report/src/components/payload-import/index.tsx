import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type Ref,
  type RefObject,
} from 'react';
import { IconChevronRight } from '../icons.js';
import type { PayloadLoadResult } from '../../data/loader/index.js';

const kindLabel = (r: PayloadLoadResult & { ok: false }) =>
  r.kind === 'missing' ?
    'Missing payload'
  : r.kind === 'parse' ?
    'Invalid JSON'
  : r.kind === 'version' ?
    'Unsupported schema version'
  : 'Schema mismatch';

export type PayloadImportPanelProps = {
  onApply: (raw: string) => boolean;
  error: PayloadLoadResult | null;
  onClearError: () => void;
  /** Initial expanded state for the error gate (`<details>`). Main shell omits or uses `false`. */
  defaultOpen?: boolean;
  /**
   * When set, renders the import UI in the nav row. Parent shows an “Import JSON” trigger when `open` is false.
   * {@link PayloadImportPanel} returns `null` when `open` is false.
   */
  shell?: {
    open: boolean;
    onClose: () => void;
  };
};

type PayloadImportBodyProps = {
  id: string;
  text: string;
  setText: (v: string) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onOpenFilePicker: () => void;
  onApply: () => void;
  onPickFile: (e: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onClearError: () => void;
  failed: (PayloadLoadResult & { ok: false }) | null;
};

function PayloadImportBody({
  id,
  text,
  setText,
  fileInputRef,
  onOpenFilePicker,
  onApply,
  onPickFile,
  onClearError,
  failed,
}: PayloadImportBodyProps): JSX.Element {
  return (
    <div className="payload-import__body">
      <p className="payload-import__hint">
        Paste output from{' '}
        <code className="mono payload-import__cmd">i18nprune report --format json</code>, or choose a file. Same shape as
        the payload embedded in HTML. Validation uses <code className="mono">projectReportDocumentSchema</code> (
        <code className="mono">kind</code>: <code className="mono">i18nprune.projectReport</code>, matching{' '}
        <code className="mono">schemaVersion</code>).
      </p>
      <div className="payload-import__row">
        <label className="payload-import__label" htmlFor={id}>
          Paste JSON
        </label>
        <textarea
          id={id}
          className="payload-import__textarea mono"
          rows={8}
          spellCheck={false}
          value={text}
          placeholder='{ "kind": "i18nprune.projectReport", ... }'
          onChange={(e) => {
            setText(e.target.value);
            onClearError();
          }}
        />
      </div>
      <div className="payload-import__actions">
        <button type="button" className="btn-primary" onClick={onApply}>
          Load report
        </button>
        <input
          ref={fileInputRef as Ref<HTMLInputElement>}
          type="file"
          accept=".json,application/json"
          className="payload-import__file"
          aria-label="Choose JSON file"
          onChange={onPickFile}
        />
        <button type="button" className="btn-secondary" onClick={onOpenFilePicker}>
          Choose file…
        </button>
      </div>
      {failed ?
        <div className="payload-import__err" role="alert">
          <p className="badge" style={{ marginBottom: '0.5rem' }}>
            {kindLabel(failed)}
          </p>
          <p style={{ color: 'var(--fg-muted)' }}>{failed.message}</p>
          {failed.detail ?
            <pre className="mono payload-import__err-pre">{failed.detail}</pre>
          : null}
        </div>
      : null}
    </div>
  );
}

export function PayloadImportPanel({
  onApply,
  error,
  onClearError,
  defaultOpen = false,
  shell,
}: PayloadImportPanelProps): JSX.Element | null {
  const id = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(defaultOpen);
  /** Inner collapse for shell mode (Close is separate). */
  const [innerOpen, setInnerOpen] = useState(true);

  const failed = error && !error.ok ? error : null;

  useEffect(() => {
    if (failed) {
      setExpanded(true);
      if (shell?.open) setInnerOpen(true);
    }
  }, [failed, shell?.open]);

  if (shell && !shell.open) return null;

  const apply = () => {
    const ok = onApply(text);
    if (ok && shell) shell.onClose();
  };

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const raw = await f.text();
      setText(raw);
      onClearError();
      const ok = onApply(raw);
      if (ok && shell) shell.onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      window.alert(`Could not read file: ${msg}`);
    }
    e.target.value = '';
  };

  const bodyProps: PayloadImportBodyProps = {
    id,
    text,
    setText,
    fileInputRef,
    onOpenFilePicker: () => fileInputRef.current?.click(),
    onApply: apply,
    onPickFile,
    onClearError,
    failed,
  };

  if (shell) {
    return (
      <div className="payload-import-shell">
        <div className="payload-import-shell__toolbar">
          <span className="payload-import-shell__title">Import report JSON</span>
          <button type="button" className="btn-secondary payload-import-shell__close" onClick={() => shell.onClose()}>
            Close
          </button>
          <button
            type="button"
            className="btn-secondary payload-import-shell__collapse-btn"
            onClick={() => setInnerOpen((o) => !o)}
            aria-expanded={innerOpen}
          >
            {innerOpen ? 'Collapse' : 'Expand'}
          </button>
        </div>
        {innerOpen ?
          <PayloadImportBody {...bodyProps} />
        : null}
      </div>
    );
  }

  return (
    <details
      className="payload-import"
      open={expanded}
      onToggle={(e) => {
        setExpanded(e.currentTarget.open);
      }}
    >
      <summary className="payload-import__summary">
        <span className="payload-import__chevron" aria-hidden>
          <IconChevronRight className="payload-import__chevron-svg" />
        </span>
        <span className="payload-import__summary-text">
          <span className="payload-import__title">Import report JSON</span>
          <span className="payload-import__subtitle">
            {expanded ?
              'Tap the header to collapse'
            : 'Collapsed — tap to expand and paste or upload a different report'}
          </span>
        </span>
      </summary>
      <PayloadImportBody {...bodyProps} />
    </details>
  );
}
