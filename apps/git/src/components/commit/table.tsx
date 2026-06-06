import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ToolbarDropdown } from '@i18nprune/ui/react/toolbar';
import { ListPagination } from '@i18nprune/ui/react/pagination';
import type { Commit, CommitType } from '../../types';
import { TYPE_COLORS } from '../../types';
import { PAGE_SIZE_OPTIONS, paginationNavIcons } from '../icons';
import {
  CommitPreviewLayer,
  computePreviewPosition,
  type PreviewAnchor,
} from './preview';
import styles from './table.module.css';

interface CommitTableProps {
  commits: Commit[];
}

const TYPE_FILTERS: Array<CommitType | 'all'> = [
  'all',
  'feat',
  'chore',
  'docs',
  'refactor',
  'fix',
  'test',
  'ci',
];

const DEFAULT_PAGE_SIZE = 25;
const HOVER_DELAY_MS = 180;

type ScopeFilter = 'all' | string;

function matchesCommitSearch(commit: Commit, query: string): boolean {
  if (!query) return true;
  const haystack = [
    commit.date,
    commit.type,
    commit.scope,
    commit.subject,
    commit.body,
  ]
    .join('\n')
    .toLowerCase();
  return haystack.includes(query);
}

export function CommitTable({ commits }: CommitTableProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';

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

  const [typeFilter, setTypeFilter] = useState<CommitType | 'all'>('all');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [preview, setPreview] = useState<PreviewAnchor | null>(null);
  const hoverTimer = useRef<number | null>(null);

  const scopes = useMemo(() => {
    const set = new Set(commits.map((c) => c.scope));
    return Array.from(set).sort();
  }, [commits]);

  const scopeOptions = useMemo(
    () => [
      { value: 'all', label: 'All scopes' },
      ...scopes.map((scope) => ({ value: scope, label: scope })),
    ],
    [scopes],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return commits.filter((commit) => {
      if (typeFilter !== 'all' && commit.type !== typeFilter) return false;
      if (scopeFilter !== 'all' && commit.scope !== scopeFilter) return false;
      if (!matchesCommitSearch(commit, query)) return false;
      return true;
    });
  }, [commits, search, typeFilter, scopeFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, scopeFilter, pageSize]);

  useEffect(() => {
    return () => {
      if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    };
  }, []);

  const clearHoverTimer = (): void => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const handleRowEnter = (commit: Commit, row: HTMLElement): void => {
    clearHoverTimer();
    hoverTimer.current = window.setTimeout(() => {
      const { top, left } = computePreviewPosition(row);
      setPreview({ commit, top, left });
    }, HOVER_DELAY_MS);
  };

  const handleRowLeave = (): void => {
    clearHoverTimer();
    setPreview(null);
  };

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
          placeholder="Search date, type, scope, subject, body…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search commits by date, type, scope, subject, or body"
        />
        <div className={styles.filters} role="group" aria-label="Filter by type">
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
        <div className={styles.scopeDropdown}>
          <ToolbarDropdown
            prefix="Scope"
            showChevron
            options={scopeOptions}
            value={scopeFilter}
            onChange={(value) => setScopeFilter(value)}
            ariaLabel="Filter by scope"
          />
        </div>
      </div>

      <p className={styles.resultCount}>
        {filtered.length} of {commits.length} commits
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Scope</th>
              <th>Subject</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.empty}>
                  No commits match the current filters.
                </td>
              </tr>
            ) : (
              pageRows.map((commit) => (
                <tr
                  key={commit.hash}
                  className={styles.row}
                  tabIndex={0}
                  role="link"
                  aria-label={`View commit ${commit.subject}`}
                  onMouseEnter={(event) => handleRowEnter(commit, event.currentTarget)}
                  onMouseLeave={handleRowLeave}
                  onFocus={(event) => handleRowEnter(commit, event.currentTarget)}
                  onBlur={handleRowLeave}
                  onClick={(event) => {
                    if (
                      event.target instanceof HTMLElement &&
                      event.target.closest('a')
                    ) {
                      return;
                    }
                    navigate(`/commits/${commit.hash}`);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/commits/${commit.hash}`);
                    }
                  }}
                >
                  <td className={styles.date}>{commit.date}</td>
                  <td>
                    <span
                      className={styles.badge}
                      style={{ backgroundColor: TYPE_COLORS[commit.type] }}
                    >
                      {commit.type}
                    </span>
                  </td>
                  <td className={styles.scope}>{commit.scope}</td>
                  <td className={styles.subject}>
                    <Link to={`/commits/${commit.hash}`} className={styles.rowLink}>
                      {commit.subject}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

      <CommitPreviewLayer anchor={preview} />
    </div>
  );
}
