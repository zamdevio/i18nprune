import React from 'react';
import { useSearchQuery } from '../../context/search/index.js';
import { IconSearch } from '../icons.js';

export function ReportSearchBar(): JSX.Element {
  const { query, setQuery } = useSearchQuery();
  return (
    <label className="report-search">
      <IconSearch className="report-search__icon" />
      <input
        type="search"
        className="report-search-input"
        placeholder="Search keys, paths, functions…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search report"
      />
    </label>
  );
}
