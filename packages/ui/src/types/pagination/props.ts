import type { ReactNode } from 'react';

export type PaginationNavIcons = {
  first: ReactNode;
  prev: ReactNode;
  next: ReactNode;
  last: ReactNode;
};

export type ListPaginationProps = {
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  rangeStart: number;
  rangeEnd: number;
  pageSizeOptions: readonly number[];
  icons: PaginationNavIcons;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Extra root class (e.g. `list-pagination--plain`). */
  className?: string;
  /** Summary noun when total > 0. Default: `results`. */
  summaryNoun?: string;
};
