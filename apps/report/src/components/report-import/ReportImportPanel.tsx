import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@i18nprune/ui/react/feedback';
import { FileDropZone } from '@i18nprune/ui/react/surfaces';
import { IconChevronRight } from '../icons.js';
import { useReportBootstrap, useReportImport } from '../../context/report/hooks.js';
import { recordShareHistory } from '../../storage/shareHistory.js';
import { readWorkerUrl } from '../../storage/workerUrl.js';
import type { PayloadLoadResult } from '../../data/loader/index.js';
import { ReportProcessPanel } from './ReportProcessPanel.js';
import { ReportShareLinkDialog } from './ReportShareLinkDialog.js';

const kindLabel = (r: PayloadLoadResult & { ok: false }) =>
  r.kind === 'missing' ?
    'Missing payload'
  : r.kind === 'parse' ?
    'Invalid JSON'
  : r.kind === 'version' ?
    'Unsupported schema version'
  : 'Schema mismatch';

export type ReportImportChooserActions = {
  chooseZip: () => void;
  chooseJson: () => void;
};

export type ReportImportPanelProps = {
  /** When true, paste JSON section starts expanded (error gate). */
  defaultPasteOpen?: boolean;
  /** Called after a report document is loaded into the session. */
  onLoaded?: () => void;
  /** Hero “Choose .zip” / “Choose Json” buttons register pickers here. */
  onRegisterChooser?: (actions: ReportImportChooserActions) => void;
};

export function ReportImportPanel({
  defaultPasteOpen = false,
  onLoaded,
  onRegisterChooser,
}: ReportImportPanelProps): JSX.Element {
  const navigate = useNavigate();
  const bootstrap = useReportBootstrap();
  const { setDocFromRaw, importError, clearImportError } = useReportImport();
  const id = useId();
  const zipInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [pasteOpen, setPasteOpen] = useState(defaultPasteOpen);
  const [dropDepth, setDropDepth] = useState(0);
  const [processFile, setProcessFile] = useState<File | null>(null);
  const [shareDialog, setShareDialog] = useState<{
    link: string | null;
    humanLines: string[];
    error: string | null;
  } | null>(null);

  const failed = importError && !importError.ok ? importError : null;

  const finishLoad = useCallback(() => {
    onLoaded?.();
    navigate('/overview');
  }, [navigate, onLoaded]);

  const applyJson = useCallback(
    (raw: string) => {
      const ok = setDocFromRaw(raw);
      if (ok) finishLoad();
      return ok;
    },
    [setDocFromRaw, finishLoad],
  );

  async function handleDroppedFiles(files: FileList | File[]): Promise<void> {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    const f = arr[0]!;
    const lower = f.name.toLowerCase();
    if (lower.endsWith('.json')) {
      try {
        const raw = await f.text();
        setText(raw);
        clearImportError();
        applyJson(raw);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
      return;
    }
    if (lower.endsWith('.zip')) {
      setProcessFile(f);
      return;
    }
    toast.error('Drop a .zip project archive or a prepared .json report file.');
  }

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = '';
    await handleDroppedFiles([f]);
  };

  const chooseZip = useCallback(() => zipInputRef.current?.click(), []);
  const chooseJson = useCallback(() => jsonInputRef.current?.click(), []);

  useEffect(() => {
    onRegisterChooser?.({ chooseZip, chooseJson });
  }, [onRegisterChooser, chooseZip, chooseJson]);

  return (
    <section className="report-import">
      <FileDropZone
        id="report-import-drop"
        dropDepth={dropDepth}
        title="Drop files here"
        hint="Project .zip archive or prepared report .json"
        onDragEnter={(e) => {
          e.preventDefault();
          setDropDepth((d) => d + 1);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDropDepth((d) => Math.max(0, d - 1));
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDropDepth(0);
          const dropped = e.dataTransfer.files;
          if (dropped.length) void handleDroppedFiles(dropped);
        }}
      >
        <div className="drop-zone__actions">
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip,application/zip"
            className="payload-import__file"
            aria-label="Choose zip archive"
            onChange={onPickFile}
          />
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            className="payload-import__file"
            aria-label="Choose JSON report file"
            onChange={onPickFile}
          />
          <button type="button" className="btn-secondary" onClick={chooseZip}>
            Choose .zip
          </button>
          <button type="button" className="btn-secondary" onClick={chooseJson}>
            Choose Json
          </button>
        </div>
      </FileDropZone>

      <details
        className="payload-import"
        open={pasteOpen}
        onToggle={(e) => {
          setPasteOpen(e.currentTarget.open);
        }}
      >
        <summary className="payload-import__summary">
          <span className="payload-import__chevron" aria-hidden>
            <IconChevronRight className="payload-import__chevron-svg" />
          </span>
          <span className="payload-import__summary-text">
            <span className="payload-import__title">Paste report JSON</span>
            <span className="payload-import__subtitle">
              {pasteOpen ?
                'Tap the header to collapse'
              : 'Collapsed — tap to expand and paste CLI report output'}
            </span>
          </span>
        </summary>
        <div className="payload-import__body">
          <p className="payload-import__hint">
            Paste output from{' '}
            <code className="mono payload-import__cmd">i18nprune report --format json</code>, or choose a .json file
            above. Validation uses <code className="mono">projectReportDocumentSchema</code>.
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
                clearImportError();
              }}
            />
          </div>
          <div className="payload-import__actions">
            <button type="button" className="btn-primary" onClick={() => applyJson(text)}>
              Load report
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
      </details>

      {processFile ?
        <ReportProcessPanel
          open
          initialFile={processFile}
          onClose={() => setProcessFile(null)}
          onLocalComplete={(doc) => {
            bootstrap.setDocFromDocument(doc);
            setProcessFile(null);
            finishLoad();
          }}
          onRemotePreparedComplete={({ doc, reportId, link }) => {
            bootstrap.setDocFromDocument(doc);
            bootstrap.bindWorkerReport(reportId);
            const workerBaseUrl = readWorkerUrl();
            recordShareHistory({
              reportId,
              workerBaseUrl,
              activity: 'shared',
              shareUrl: link,
              toolVersion: doc.toolVersion,
              generatedAt: doc.generatedAt,
            });
            setProcessFile(null);
            setShareDialog({ link, humanLines: [], error: null });
            finishLoad();
          }}
          onRemoteArchiveComplete={({ reportId, link, humanLines }) => {
            const workerBaseUrl = readWorkerUrl();
            recordShareHistory({
              reportId,
              workerBaseUrl,
              activity: 'shared',
              shareUrl: link,
            });
            setProcessFile(null);
            setShareDialog({ link, humanLines, error: null });
          }}
          onRemoteError={(message, humanLines) => {
            setShareDialog({ link: null, humanLines, error: message });
          }}
        />
      : null}

      {shareDialog ?
        <ReportShareLinkDialog
          open
          link={shareDialog.link}
          humanLines={shareDialog.humanLines}
          error={shareDialog.error}
          onClose={() => setShareDialog(null)}
        />
      : null}
    </section>
  );
}
