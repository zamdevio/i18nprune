import type { ReactNode } from 'react';

/**
 * List pages: search + print above the table, pagination below.
 */
export function ListTableSection({
  printDisabled,
  onPrint,
  search,
  table,
  pagination,
}: {
  printDisabled: boolean;
  onPrint: () => void;
  search?: ReactNode;
  table: ReactNode;
  pagination: ReactNode;
}): JSX.Element {
  return (
    <div className="list-table-section">
      <div className="list-table-toolbar no-print">
        <div className="list-table-toolbar__start">{search}</div>
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

/** Search-only toolbar for list pages with no table rows (e.g. zero search hits). */
export function ListTableSearchToolbar({ search }: { search: ReactNode }): JSX.Element {
  return (
    <div className="list-table-toolbar list-table-toolbar--search-only no-print">
      <div className="list-table-toolbar__start">{search}</div>
    </div>
  );
}
