import { useEffect, useId, useState } from 'react';
import type { PrintReportTableInput } from '../lib/printTable.js';

export type PrintScope = 'page' | 'filtered' | 'full';

const LARGE = 2500;

export type PrintTableDialogProps = {
  open: boolean;
  onClose: () => void;
  sectionTitle: string;
  reportTitle: string;
  headers: string[];
  /** Row counts for each scope */
  counts: { page: number; filtered: number; full: number };
  /** Build rows for the chosen scope (caller uses payload + pagination state). */
  getRows: (scope: PrintScope) => string[][];
  onCommitPrint: (opts: PrintReportTableInput) => void;
};

export function PrintTableDialog({
  open,
  onClose,
  sectionTitle,
  reportTitle,
  headers,
  counts,
  getRows,
  onCommitPrint,
}: PrintTableDialogProps): JSX.Element | null {
  const titleId = useId();
  const [scope, setScope] = useState<PrintScope>('filtered');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const n =
    scope === 'page' ? counts.page : scope === 'filtered' ? counts.filtered : counts.full;
  const largeWarn = n > LARGE;

  const runPrint = (): void => {
    const rows = getRows(scope);
    if (rows.length === 0) return;
    const metaParts: string[] = [`${rows.length} row(s)`];
    if (scope === 'page') metaParts.push('current page only');
    else if (scope === 'filtered') metaParts.push('matching search');
    else metaParts.push('full embedded section');
    onCommitPrint({
      sectionTitle,
      reportTitle,
      headers,
      rows,
      metaLine: metaParts.join(' · '),
    });
    onClose();
  };

  return (
    <div className="print-dialog-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="print-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="print-dialog__title">
          Print · {sectionTitle}
        </h2>
        <p className="print-dialog__hint">
          Uses the embedded JSON payload. Choose how many rows to send to the printer (large lists can be slow).
        </p>
        <fieldset className="print-dialog__fieldset">
          <legend className="visually-hidden">Print scope</legend>
          <label className="print-dialog__option">
            <input
              type="radio"
              name="print-scope"
              checked={scope === 'page'}
              onChange={() => setScope('page')}
            />
            <span>
              <strong>Current page</strong> ({counts.page} rows visible in the table)
            </span>
          </label>
          <label className="print-dialog__option">
            <input
              type="radio"
              name="print-scope"
              checked={scope === 'filtered'}
              onChange={() => setScope('filtered')}
            />
            <span>
              <strong>All matching search</strong> ({counts.filtered} rows)
            </span>
          </label>
          <label className="print-dialog__option">
            <input
              type="radio"
              name="print-scope"
              checked={scope === 'full'}
              onChange={() => setScope('full')}
            />
            <span>
              <strong>Full embedded section</strong> ({counts.full} rows in this report file)
            </span>
          </label>
        </fieldset>
        {largeWarn ? (
          <p className="print-dialog__warn">
            This selection has over {LARGE.toLocaleString()} rows — printing may take a while or stress the browser.
          </p>
        ) : null}
        <div className="print-dialog__actions">
          <button type="button" className="theme-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="theme-btn print-dialog__print" onClick={runPrint} disabled={n === 0}>
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
