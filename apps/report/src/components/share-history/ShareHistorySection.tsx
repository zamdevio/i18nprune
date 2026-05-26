import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@i18nprune/ui/react/overlay';
import { toast } from '@i18nprune/ui/react/feedback';
import { ListPagination } from '@i18nprune/ui/react/pagination';
import { CopyPathButton } from '../CopyPathButton.js';
import { useReportBootstrap } from '../../context/report/hooks.js';
import {
  pendingRemoteDeleteCount,
  runRemoteDeleteQueue,
  startRemoteDeleteQueue,
} from '../../lib/share/deleteAllRemote.js';
import { clearShareHistory, listShareHistory, removeShareHistoryEntry, shareHistoryStats } from '../../storage/index.js';
import { readWorkerUrl } from '../../storage/workerUrl.js';
import { deleteWorkerReport } from '../../worker/index.js';
import type { ShareHistoryEntry } from '../../types/share/index.js';

const PAGE_SIZES = [10, 25, 50, 100] as const;

const paginationIcons = {
  first: '«',
  prev: '‹',
  next: '›',
  last: '»',
};

function activityLabel(entry: ShareHistoryEntry): string {
  const parts: string[] = [];
  if (entry.activities.includes('shared')) parts.push('shared');
  if (entry.activities.includes('viewed')) parts.push('viewed');
  return parts.join(' · ') || 'viewed';
}

function reportIdCell(entry: ShareHistoryEntry): string {
  return entry.toolVersion ? `${entry.reportId} (${entry.toolVersion})` : entry.reportId;
}

function IconAlertTriangle(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function ShareHistorySection(): JSX.Element {
  const navigate = useNavigate();
  const bootstrap = useReportBootstrap();
  const [entries, setEntries] = useState(() => listShareHistory());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllBusy, setDeleteAllBusy] = useState(false);
  const [rowDeleteId, setRowDeleteId] = useState<string | null>(null);
  const [rowDeleteBusy, setRowDeleteBusy] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState(() => pendingRemoteDeleteCount());

  const stats = shareHistoryStats();
  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rangeStart = entries.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, entries.length);
  const pageRows = useMemo(
    () => entries.slice((safePage - 1) * pageSize, safePage * pageSize),
    [entries, safePage, pageSize],
  );

  const refresh = useCallback(() => {
    setEntries(listShareHistory());
    setPendingDeletes(pendingRemoteDeleteCount());
  }, []);

  const openEntry = useCallback(
    (reportId: string) => {
      bootstrap.openSharedReport(reportId);
      navigate({ pathname: '/', search: `?id=${encodeURIComponent(reportId)}` });
    },
    [bootstrap, navigate],
  );

  const runQueuedDeletes = useCallback(async () => {
    const initial = pendingRemoteDeleteCount() || entries.length;
    const toastId = toast.loading(
      initial > 0 ? `Deleting remote reports… 0/${String(initial)}` : 'Deleting remote reports…',
    );
    setDeleteAllBusy(true);
    const result = await runRemoteDeleteQueue((progress) => {
      if (progress.total > 0) {
        toast.loading(`Deleting remote reports… ${String(progress.done)}/${String(progress.total)}`, {
          id: toastId,
        });
      }
    });
    setDeleteAllBusy(false);
    refresh();
    if (result.stopped && result.lastError) {
      toast.error(result.lastError, { id: toastId });
      if (result.done > 0) {
        toast.message(`${String(result.done)} of ${String(result.total)} deleted before stop.`);
      }
      return;
    }
    if (result.done > 0) {
      toast.success(
        result.done === 1 ? 'Remote report deleted.' : `${String(result.done)} remote reports deleted.`,
        { id: toastId },
      );
    } else {
      toast.dismiss(toastId);
    }
  }, [entries.length, refresh]);

  function clearWorkerAssociation(reportId: string): void {
    if (bootstrap.workerReportId !== reportId) return;
    if (bootstrap.source === 'worker') {
      bootstrap.evictHostedReport();
    } else {
      bootstrap.clearWorkerBinding();
    }
  }

  async function deleteRemoteRow(reportId: string): Promise<void> {
    setRowDeleteBusy(true);
    const result = await deleteWorkerReport(readWorkerUrl(), reportId);
    setRowDeleteBusy(false);
    if (!result.ok) {
      toast.error(result.issue.message);
      return;
    }
    removeShareHistoryEntry(reportId);
    clearWorkerAssociation(reportId);
    refresh();
    if (result.issue) toast.warning(result.issue.message);
    else toast.success('Report deleted from worker.');
    setRowDeleteId(null);
  }

  return (
    <section className="panel share-history-panel">
      <div className="share-history-panel__head">
        <h2 className="share-panel__title">Recent share links</h2>
        <span className="muted">
          {stats.count} / {stats.max} stored
        </span>
      </div>

      {entries.length === 0 ?
        <p className="muted">No hosted report links yet. Open or share a report to add one.</p>
      : <>
          <div className="share-history-table-wrap">
            <table className="share-history-table">
              <thead>
                <tr>
                  <th>Report id</th>
                  <th>Activity</th>
                  <th>Last seen</th>
                  <th>Worker</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr
                    key={row.reportId}
                    className="share-history-table__row"
                    tabIndex={0}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, a, [role="button"]')) return;
                      openEntry(row.reportId);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openEntry(row.reportId);
                      }
                    }}
                  >
                    <td>
                      <code className="mono share-history-table__id">{reportIdCell(row)}</code>
                    </td>
                    <td>{activityLabel(row)}</td>
                    <td>{new Date(row.lastSeenAt).toLocaleString()}</td>
                    <td className="mono share-history-table__worker">{row.workerBaseUrl}</td>
                    <td className="share-history-table__actions">
                      <CopyPathButton text={row.shareUrl} label="Copy" />
                      <button
                        type="button"
                        className="btn-secondary btn-danger-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRowDeleteId(row.reportId);
                        }}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeShareHistoryEntry(row.reportId);
                          refresh();
                          toast.message('Removed from local history.');
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ListPagination
            total={entries.length}
            page={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            pageSizeOptions={[...PAGE_SIZES]}
            icons={paginationIcons}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
            summaryNoun="links"
          />
        </>
      }

      <div className="share-panel__actions">
        <button type="button" className="btn-secondary" onClick={refresh}>
          Refresh list
        </button>
        <button
          type="button"
          className="btn-secondary btn-danger-outline"
          disabled={entries.length === 0 || deleteAllBusy}
          onClick={() => setDeleteAllOpen(true)}
        >
          Delete all remote
        </button>
        {pendingDeletes > 0 ?
          <button
            type="button"
            className="btn-secondary btn-danger-outline"
            disabled={deleteAllBusy}
            onClick={() => void runQueuedDeletes()}
          >
            Resume delete ({pendingDeletes})
          </button>
        : null}
        <button type="button" className="btn-secondary" disabled={entries.length === 0} onClick={() => setClearOpen(true)}>
          Clear all
        </button>
      </div>

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear share history?"
        description="Removes every stored share link from this browser. Export first from Settings if you want a backup."
        confirmLabel="Clear all"
        variant="danger"
        busy={clearBusy}
        onConfirm={async () => {
          setClearBusy(true);
          clearShareHistory();
          refresh();
          setClearBusy(false);
          setClearOpen(false);
          toast.success('Share history cleared.');
        }}
      />

      <ConfirmDialog
        open={deleteAllOpen}
        onClose={() => !deleteAllBusy && setDeleteAllOpen(false)}
        title="Delete all remote reports?"
        description="Deletes each report on the worker one at a time. Progress is saved in this browser so you can resume after a reload or network error. Stops on the first failure."
        confirmLabel="Delete all remote"
        variant="danger"
        titleIcon={<IconAlertTriangle />}
        busy={deleteAllBusy}
        onConfirm={async () => {
          startRemoteDeleteQueue(entries.map((e) => e.reportId));
          setDeleteAllOpen(false);
          await runQueuedDeletes();
        }}
      />

      <ConfirmDialog
        open={rowDeleteId !== null}
        onClose={() => !rowDeleteBusy && setRowDeleteId(null)}
        title="Delete report from worker?"
        description={
          rowDeleteId ?
            `Permanently remove ${rowDeleteId} from the worker. Local history entry is removed on success.`
          : ''
        }
        confirmLabel="Delete report"
        variant="danger"
        titleIcon={<IconAlertTriangle />}
        busy={rowDeleteBusy}
        onConfirm={async () => {
          if (!rowDeleteId) return;
          await deleteRemoteRow(rowDeleteId);
        }}
      />
    </section>
  );
}
