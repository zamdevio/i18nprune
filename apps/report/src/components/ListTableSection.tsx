import type { ReactNode } from 'react';

/**
 * List pages: Print control above the table (right-aligned), table, pagination below.
 */
export function ListTableSection({
  printDisabled,
  onPrint,
  table,
  pagination,
}: {
  printDisabled: boolean;
  onPrint: () => void;
  table: ReactNode;
  pagination: ReactNode;
}): JSX.Element {
  return (
    <div className="list-table-section">
      <div className="list-table-toolbar no-print">
        <button
          type="button"
          className="theme-btn print-table-btn"
          disabled={printDisabled}
          onClick={onPrint}
        >
          Print…
        </button>
      </div>
      {table}
      <div className="list-table-section__pagination no-print">{pagination}</div>
    </div>
  );
}
