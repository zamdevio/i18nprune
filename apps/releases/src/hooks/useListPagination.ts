import { useEffect, useMemo, useState } from 'react';

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const;

export type UseListPaginationOptions = {
  initialPageSize?: number;
  pageSizeOptions?: readonly number[];
  /** When any value changes, reset to page 1 (e.g. filter key). */
  resetKey?: unknown;
};

export function useListPagination<T>(
  items: readonly T[],
  {
    initialPageSize = 10,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    resetKey,
  }: UseListPaginationOptions = {},
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, total);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  return {
    pageItems,
    page: safePage,
    pageSize,
    total,
    totalPages,
    rangeStart,
    rangeEnd,
    pageSizeOptions,
    setPage,
    setPageSize,
  };
}
