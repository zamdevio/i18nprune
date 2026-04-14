import React, { useEffect, useMemo, useState } from 'react';
import { PAGE_SIZE_OPTIONS } from '../../context/pagination/index.js';
import { ToolbarDropdown } from '../ToolbarDropdown.js';
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from '../icons.js';

export type ListPaginationProps = {
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function ListPagination({
  total,
  page,
  totalPages,
  pageSize,
  rangeStart,
  rangeEnd,
  onPageChange,
  onPageSizeChange,
}: ListPaginationProps): JSX.Element {
  const [draft, setDraft] = useState(String(page));
  const rowOptions = useMemo(
    () => PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) })),
    [],
  );
  useEffect(() => {
    setDraft(String(page));
  }, [page]);

  const commitDraft = (): void => {
    const n = Number.parseInt(draft, 10);
    if (!Number.isFinite(n)) {
      setDraft(String(page));
      return;
    }
    const clamped = Math.min(Math.max(1, Math.floor(n)), totalPages);
    onPageChange(clamped);
    setDraft(String(clamped));
  };

  return (
    <div className="list-pagination" role="navigation" aria-label="Table pagination">
      <div className="list-pagination__summary">
        {total === 0 ? (
          <span>0 results</span>
        ) : (
          <span>
            Showing <strong>{rangeStart}</strong>–<strong>{rangeEnd}</strong> of <strong>{total}</strong>
          </span>
        )}
      </div>
      <div className="list-pagination__controls">
        <div className="list-pagination__size">
          <span className="list-pagination__size-label">Rows</span>
          <div className="list-pagination__rows-dropdown">
            <ToolbarDropdown
              className="toolbar-dropdown--dropup"
              prefix="Rows"
              options={rowOptions}
              value={String(pageSize)}
              onChange={(v) => onPageSizeChange(Number(v))}
              ariaLabel="Rows per page"
            />
          </div>
        </div>
        <div className="list-pagination__nav">
          <button
            type="button"
            className="theme-btn list-pagination__icon-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            aria-label="First page"
          >
            <IconChevronsLeft />
          </button>
          <button
            type="button"
            className="theme-btn list-pagination__icon-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <IconChevronLeft />
          </button>
          <label className="list-pagination__page-field">
            <span className="visually-hidden">Page</span>
            <input
              className="list-pagination__page-input"
              type="text"
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitDraft();
                }
              }}
              aria-label="Current page number"
            />
            <span className="list-pagination__of">/ {totalPages}</span>
          </label>
          <button
            type="button"
            className="theme-btn list-pagination__icon-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <IconChevronRight />
          </button>
          <button
            type="button"
            className="theme-btn list-pagination__icon-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="Last page"
          >
            <IconChevronsRight />
          </button>
        </div>
      </div>
    </div>
  );
}
