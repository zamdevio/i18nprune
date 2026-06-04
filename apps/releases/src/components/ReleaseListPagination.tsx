import { ListPagination } from '@i18nprune/ui/react/pagination';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

const paginationIcons = {
  first: <ChevronsLeft className="h-4 w-4" aria-hidden />,
  prev: <ChevronLeft className="h-4 w-4" aria-hidden />,
  next: <ChevronRight className="h-4 w-4" aria-hidden />,
  last: <ChevronsRight className="h-4 w-4" aria-hidden />,
};

type ReleaseListPaginationProps = {
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  rangeStart: number;
  rangeEnd: number;
  pageSizeOptions: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  summaryNoun?: string;
};

export default function ReleaseListPagination(props: ReleaseListPaginationProps) {
  if (props.total === 0) return null;

  return (
    <ListPagination
      className="list-pagination--plain mt-6"
      icons={paginationIcons}
      summaryNoun={props.summaryNoun ?? 'releases'}
      {...props}
    />
  );
}
