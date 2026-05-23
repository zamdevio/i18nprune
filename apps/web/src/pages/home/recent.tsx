import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { DeleteConfirmButton } from '../../components/ui/delete';
import { ToolbarDropdown } from '../../components/ui/toolbar-dropdown';
import type { RecentProjectZipEntry } from '../../types/index.js';

type Props = {
  recentQuery: string;
  onRecentQueryChange: (q: string) => void;
  canUseRecent: boolean;
  filteredRecent: RecentProjectZipEntry[];
  pagedRecent: RecentProjectZipEntry[];
  recentError: string | null;
  loadingRecentId: string | null;
  rangeStart: number;
  rangeEnd: number;
  safePage: number;
  totalPages: number;
  recentPageSize: number;
  onPageSizeChange: (n: number) => void;
  onSetPage: (n: number) => void;
  onOpenRecent: (entry: RecentProjectZipEntry) => void;
  onRemoveRecent: (id: string) => void;
};

const pageSizeOptions = [5, 10, 15, 20] as const;

export function Recent({
  recentQuery,
  onRecentQueryChange,
  canUseRecent,
  filteredRecent,
  pagedRecent,
  recentError,
  loadingRecentId,
  rangeStart,
  rangeEnd,
  safePage,
  totalPages,
  recentPageSize,
  onPageSizeChange,
  onSetPage,
  onOpenRecent,
  onRemoveRecent,
}: Props) {
  return (
    <section className="panel">
      <div className="recent-head">
        <h2>Recent cached zips</h2>
        <div className="recent-search">
          <Search size={16} className="recent-search__icon" aria-hidden />
          <input
            type="search"
            placeholder="Search by name, id, or sha256…"
            value={recentQuery}
            onChange={(e) => onRecentQueryChange(e.target.value)}
          />
        </div>
      </div>
      {!canUseRecent ? (
        <p className="muted">
          Recent project zip caching is disabled. Enable it in <a href="#/settings">Settings</a> to keep local zip snapshots.
        </p>
      ) : filteredRecent.length === 0 ? (
        <p className="muted">No cached recent zips yet.</p>
      ) : (
        <>
          <ul className="recent-list">
            {pagedRecent.map((r) => (
              <li key={r.id} className="recent-row">
                <button
                  type="button"
                  className="recent-item"
                  disabled={loadingRecentId === r.id}
                  onClick={() => void onOpenRecent(r)}
                >
                  <span className="recent-item__id">{r.name}</span>
                  <span className="muted recent-item__meta">
                    {(r.size / 1024 / 1024).toFixed(2)} MB • {new Date(r.createdAt).toLocaleString()}
                  </span>
                </button>
                <DeleteConfirmButton
                  title="Delete cached project zip?"
                  description={`This removes ${r.name} from browser storage.`}
                  confirmLabel="Delete zip"
                  triggerClassName="recent-item__delete-btn"
                  onConfirm={() => onRemoveRecent(r.id)}
                >
                  <span className="recent-item__delete" aria-label={`Delete cached zip ${r.name}`}>
                    🗑
                  </span>
                </DeleteConfirmButton>
              </li>
            ))}
          </ul>
          <div className="recent-pagination" role="navigation" aria-label="Recent projects pagination">
            <span className="muted">
              Showing <strong>{rangeStart}</strong>–<strong>{rangeEnd}</strong> of <strong>{filteredRecent.length}</strong>
            </span>
            <div className="recent-pagination__controls">
              <div className="recent-pagination__size">
                <ToolbarDropdown
                  className="toolbar-dropdown--dropup"
                  prefix="Rows"
                  ariaLabel="Rows per page"
                  options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
                  value={String(recentPageSize)}
                  onChange={(next) => {
                    const parsed = Number.parseInt(next, 10);
                    if (Number.isFinite(parsed)) onPageSizeChange(parsed);
                  }}
                />
              </div>
              <button type="button" className="theme-btn" disabled={safePage <= 1} onClick={() => onSetPage(1)} aria-label="First page">
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                className="theme-btn"
                disabled={safePage <= 1}
                onClick={() => onSetPage(safePage - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <label className="recent-pagination__page-label">
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(safePage)}
                  onChange={(e) => {
                    const n = Number.parseInt(e.target.value, 10);
                    if (Number.isFinite(n)) onSetPage(n);
                  }}
                  aria-label="Current page"
                />
                <span>/ {totalPages}</span>
              </label>
              <button
                type="button"
                className="theme-btn"
                disabled={safePage >= totalPages}
                onClick={() => onSetPage(safePage + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                className="theme-btn"
                disabled={safePage >= totalPages}
                onClick={() => onSetPage(totalPages)}
                aria-label="Last page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
      {recentError ? <p className="error-text">{recentError}</p> : null}
    </section>
  );
}
