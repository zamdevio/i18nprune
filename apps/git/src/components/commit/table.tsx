import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ToolbarDropdown } from '@i18nprune/ui/react/toolbar';
import { ListPagination } from '@i18nprune/ui/react/pagination';
import { useCompactLayout } from '../../hooks/useMediaQuery';
import type { Commit, CommitType } from '../../types';
import {
  COMMIT_TYPES,
  isValidBranchParam,
  isValidScopeParam,
  isValidTypeParam,
  parseBranchParam,
  parseScopeParam,
  parseTypeParam,
} from '../../lib/commit-params';
import { matchesCommitSearch } from '../../lib/commit-search';
import { PAGE_SIZE_OPTIONS, paginationNavIcons } from '../icons';
import { CommitList } from './list';
import { ExportActions } from './export-actions';
import styles from './table.module.css';

interface CommitTableProps {
  commits: Commit[];
}

const TYPE_FILTERS: Array<CommitType | 'all'> = ['all', ...COMMIT_TYPES];

const DEFAULT_PAGE_SIZE = 25;

export function CommitTable({ commits }: CommitTableProps) {
  const isCompact = useCompactLayout();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';

  const scopes = useMemo(() => {
    const set = new Set(commits.map((c) => c.scope));
    return Array.from(set).sort();
  }, [commits]);

  const branchNames = useMemo(() => {
    const set = new Set<string>();
    for (const commit of commits) {
      if (commit.branch) set.add(commit.branch);
    }
    return Array.from(set).sort();
  }, [commits]);

  const typeFilter = parseTypeParam(searchParams.get('type'));
  const scopeFilter = parseScopeParam(searchParams.get('scope'), scopes);
  const branchFilter = parseBranchParam(searchParams.get('branch'), branchNames);

  const setSearch = (value: string): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value.trim()) next.set('q', value);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );
  };

  const setTypeFilter = (type: CommitType | 'all'): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (type === 'all') next.delete('type');
        else next.set('type', type);
        return next;
      },
      { replace: true },
    );
  };

  const setScopeFilter = (scope: string): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (scope === 'all') next.delete('scope');
        else next.set('scope', scope);
        return next;
      },
      { replace: true },
    );
  };

  const setBranchFilter = (branch: string): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (branch === 'all') next.delete('branch');
        else next.set('branch', branch);
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const type = prev.get('type');
        const scope = prev.get('scope');
        const branch = prev.get('branch');
        if (
          isValidTypeParam(type) &&
          isValidScopeParam(scope, scopes) &&
          isValidBranchParam(branch, branchNames)
        ) {
          return prev;
        }
        const next = new URLSearchParams(prev);
        if (!isValidTypeParam(type)) next.delete('type');
        if (!isValidScopeParam(scope, scopes)) next.delete('scope');
        if (!isValidBranchParam(branch, branchNames)) next.delete('branch');
        return next;
      },
      { replace: true },
    );
  }, [branchNames, scopes, setSearchParams]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const scopeOptions = useMemo(
    () => [
      { value: 'all', label: 'All scopes' },
      ...scopes.map((scope) => ({ value: scope, label: scope })),
    ],
    [scopes],
  );

  const typeOptions = useMemo(
    () =>
      TYPE_FILTERS.map((type) => ({
        value: type,
        label: type === 'all' ? 'All types' : type,
      })),
    [],
  );

  const branchOptions = useMemo(
    () => [
      { value: 'all', label: 'All branches' },
      ...branchNames.map((branch) => ({ value: branch, label: branch })),
    ],
    [branchNames],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return commits.filter((commit) => {
      if (typeFilter !== 'all' && commit.type !== typeFilter) return false;
      if (scopeFilter !== 'all' && commit.scope !== scopeFilter) return false;
      if (branchFilter !== 'all' && commit.branch !== branchFilter) return false;
      if (!matchesCommitSearch(commit, query)) return false;
      return true;
    });
  }, [branchFilter, commits, search, scopeFilter, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [branchFilter, pageSize, scopeFilter, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filtered.length);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.search}
          placeholder="Search date, type, scope, subject, body, author, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search commits by date, type, scope, subject, or body"
        />
        <div className={styles.filterRow}>
          {isCompact ?
            <div className={styles.filterDropdown}>
              <ToolbarDropdown
                prefix="Type"
                showChevron
                options={typeOptions}
                value={typeFilter}
                onChange={(value) => setTypeFilter(value as CommitType | 'all')}
                ariaLabel="Filter by type"
              />
            </div>
          : <div className={styles.filters} role="group" aria-label="Filter by type">
              {TYPE_FILTERS.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.filterPill} ${typeFilter === type ? styles.filterPillActive : ''}`}
                  onClick={() => setTypeFilter(type)}
                >
                  {type === 'all' ? 'All' : type}
                </button>
              ))}
            </div>
          }
          <div className={styles.filterGroup}>
            <div className={styles.filterDropdown}>
              <ToolbarDropdown
                prefix="Scope"
                showChevron
                options={scopeOptions}
                value={scopeFilter}
                onChange={(value) => setScopeFilter(value)}
                ariaLabel="Filter by scope"
              />
            </div>
            <div className={styles.filterDropdown}>
              <ToolbarDropdown
                prefix="Branch"
                showChevron
                options={branchOptions}
                value={branchFilter}
                onChange={(value) => setBranchFilter(value)}
                ariaLabel="Filter by branch"
              />
            </div>
          </div>
        </div>
        <div className={styles.exportActions}>
          <ExportActions commits={filtered} />
        </div>
      </div>

      <p className={styles.resultCount}>
        {filtered.length} of {commits.length} commits
      </p>

      <CommitList
        commits={pageRows}
        emptyMessage="No commits match the current filters."
      />

      <ListPagination
        className="list-pagination--plain"
        total={filtered.length}
        page={safePage}
        totalPages={totalPages}
        pageSize={pageSize}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        icons={paginationNavIcons}
        summaryNoun="commits"
      />
    </div>
  );
}
