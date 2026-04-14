import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSearchQuery } from '../search/index.js';

const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 50, 75, 100, 150, 200] as const;

const PAGE_SIZE_SET = new Set<number>(PAGE_SIZE_OPTIONS);

const STORAGE_KEY = 'i18nprune-report-page-size';

function loadPersistedPageSizes(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const j = JSON.parse(raw) as unknown;
    if (typeof j !== 'object' || j === null) return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(j)) {
      if (typeof v === 'number' && PAGE_SIZE_SET.has(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function savePersistedPageSizes(map: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

type Slot = { page: number; pageSize: number };

type PaginationApi = {
  getSlot: (listId: string) => Slot;
  setPage: (listId: string, page: number) => void;
  setPageSize: (listId: string, pageSize: number) => void;
  resetPage: (listId: string) => void;
};

const PaginationContext = createContext<PaginationApi | null>(null);

export function PaginationProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<Record<string, Slot>>({});
  const [sizeByList, setSizeByList] = useState<Record<string, number>>(loadPersistedPageSizes);

  const getSlot = useCallback(
    (listId: string): Slot => {
      const s = state[listId];
      const defaultSize = sizeByList[listId] ?? DEFAULT_PAGE_SIZE;
      if (!s) return { page: 1, pageSize: defaultSize };
      return s;
    },
    [state, sizeByList],
  );

  const setPage = useCallback(
    (listId: string, page: number) => {
      setState((prev) => {
        const cur =
          prev[listId] ?? { page: 1, pageSize: sizeByList[listId] ?? DEFAULT_PAGE_SIZE };
        return { ...prev, [listId]: { ...cur, page } };
      });
    },
    [sizeByList],
  );

  const setPageSize = useCallback((listId: string, pageSize: number) => {
    setSizeByList((prev) => {
      const next = { ...prev, [listId]: pageSize };
      savePersistedPageSizes(next);
      return next;
    });
    setState((prev) => ({
      ...prev,
      [listId]: { page: 1, pageSize },
    }));
  }, []);

  const resetPage = useCallback(
    (listId: string) => {
      setState((prev) => {
        const cur = prev[listId];
        const ps = cur?.pageSize ?? sizeByList[listId] ?? DEFAULT_PAGE_SIZE;
        return { ...prev, [listId]: { page: 1, pageSize: ps } };
      });
    },
    [sizeByList],
  );

  const api = useMemo(
    () => ({ getSlot, setPage, setPageSize, resetPage }),
    [getSlot, setPage, setPageSize, resetPage],
  );

  return <PaginationContext.Provider value={api}>{children}</PaginationContext.Provider>;
}

export function usePaginationApi(): PaginationApi {
  const v = useContext(PaginationContext);
  if (!v) throw new Error('usePaginationApi outside PaginationProvider');
  return v;
}

export type PaginatedSlice<T> = {
  slice: T[];
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  /** 1-based inclusive display range */
  rangeStart: number;
  rangeEnd: number;
  setPage: (p: number) => void;
  setPageSize: (n: number) => void;
};

/** Paginate `items` (already filtered). Resets to page 1 when the global search query changes. */
export function usePaginatedList<T>(listId: string, items: T[]): PaginatedSlice<T> {
  const { query } = useSearchQuery();
  const pag = usePaginationApi();
  const slot = pag.getSlot(listId);

  useEffect(() => {
    pag.resetPage(listId);
  }, [query, listId, pag.resetPage]);

  const total = items.length;
  const pageSize = slot.pageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  let page = Math.min(Math.max(1, slot.page), totalPages);

  useLayoutEffect(() => {
    if (page !== slot.page) pag.setPage(listId, page);
  }, [page, slot.page, listId, pag.setPage]);

  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  const rangeStart = total === 0 ? 0 : start + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(start + pageSize, total);

  const setPage = useCallback((p: number) => pag.setPage(listId, p), [listId, pag]);
  const setPageSize = useCallback((n: number) => pag.setPageSize(listId, n), [listId, pag]);

  return useMemo(
    () => ({
      slice,
      page,
      totalPages,
      total,
      pageSize,
      rangeStart,
      rangeEnd,
      setPage,
      setPageSize,
    }),
    [slice, page, totalPages, total, pageSize, rangeStart, rangeEnd, setPage, setPageSize],
  );
}
