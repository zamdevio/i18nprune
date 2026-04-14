import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type SearchCtx = {
  query: string;
  setQuery: (q: string) => void;
};

const SearchContext = createContext<SearchCtx | null>(null);

export function SearchProvider({ children }: { children: ReactNode }): JSX.Element {
  const [query, setQuery] = useState('');
  const value = useMemo(() => ({ query, setQuery }), [query]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearchQuery(): SearchCtx {
  const v = useContext(SearchContext);
  if (!v) throw new Error('useSearchQuery outside SearchProvider');
  return v;
}

/** Case-insensitive substring match for table/search filtering. */
export function matchesSearch(query: string, ...parts: (string | number | undefined | null)[]): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return parts.some((p) => String(p ?? '').toLowerCase().includes(q));
}
