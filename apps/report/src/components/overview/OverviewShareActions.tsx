import { useState } from 'react';
import { ConfirmDialog } from '@i18nprune/ui/react/overlay';
import { toast } from '@i18nprune/ui/react/feedback';
import { useReport, useReportBootstrap } from '../../context/report/hooks.js';
import { ReportShareLinkDialog } from '../report-import/ReportShareLinkDialog.js';
import { buildHostedReportShareUrl } from '../../lib/share/reportShareUrl.js';
import { removeShareHistoryEntry } from '../../storage/shareHistory.js';
import { readWorkerUrl } from '../../storage/workerUrl.js';
import { recordShareHistory } from '../../storage/shareHistory.js';
import { deleteWorkerReport, shareRemoteReportLinkOnly, shareReportUpload } from '../../worker/index.js';

function IconShare(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconCopy(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
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

export function OverviewShareActions(): JSX.Element {
  const bootstrap = useReportBootstrap();
  const doc = useReport();
  const hostedId = bootstrap.workerReportId;
  const isHosted = Boolean(hostedId);

  const [shareBusy, setShareBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogLink, setDialogLink] = useState<string | null>(null);
  const [dialogLines, setDialogLines] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function openShareDialog(link: string, lines: string[], error: string | null): void {
    setDialogLink(link);
    setDialogLines(lines);
    setDialogError(error);
    setDialogOpen(true);
  }

  async function runUploadShare(): Promise<void> {
    setShareBusy(true);
    setDialogError(null);
    try {
      const workerBaseUrl = readWorkerUrl();
      const uploaded = await shareReportUpload({ workerBaseUrl, document: doc });
      if (!uploaded.ok) {
        toast.error(uploaded.issue.message);
        openShareDialog('', uploaded.humanLines, uploaded.issue.message);
        return;
      }
      toast.success(uploaded.deduped ? 'Report already on worker' : 'Report uploaded');
      bootstrap.bindWorkerReport(uploaded.reportId);
      recordShareHistory({
        reportId: uploaded.reportId,
        workerBaseUrl,
        activity: 'shared',
        shareUrl: uploaded.link,
        toolVersion: doc.toolVersion,
        generatedAt: doc.generatedAt,
      });
      openShareDialog(uploaded.link, uploaded.humanLines, null);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(message);
      openShareDialog('', [], message);
    } finally {
      setShareBusy(false);
    }
  }

  function openHostedLinkDialog(): void {
    if (!hostedId) return;
    const workerBaseUrl = readWorkerUrl();
    const link = buildHostedReportShareUrl(hostedId);
    const outcome = shareRemoteReportLinkOnly({ workerBaseUrl, reportId: hostedId });
    if (!outcome.ok) {
      toast.error(outcome.issue.message);
      openShareDialog(link, outcome.humanLines, outcome.issue.message);
      return;
    }
    openShareDialog(outcome.link, outcome.humanLines, null);
  }

  function clearWorkerAssociation(): void {
    if (!hostedId) return;
    if (bootstrap.source === 'worker') {
      bootstrap.evictHostedReport();
    } else {
      bootstrap.clearWorkerBinding();
    }
  }

  return (
    <>
      {isHosted ?
        <button
          type="button"
          className="theme-btn overview-action-btn"
          title="Show hosted share link"
          onClick={openHostedLinkDialog}
        >
          <IconCopy />
          <span>Copy link</span>
        </button>
      : <button
          type="button"
          className="theme-btn overview-action-btn"
          disabled={shareBusy}
          title="Upload report to worker and get a share link"
          onClick={() => void runUploadShare()}
        >
          <IconShare />
          <span>{shareBusy ? 'Sharing…' : 'Share'}</span>
        </button>
      }

      {isHosted ?
        <button
          type="button"
          className="theme-btn overview-action-btn btn-danger-outline"
          title="Delete report from worker"
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </button>
      : null}

      <button
        type="button"
        className="theme-btn overview-action-btn"
        title="Unload this report and return to the home page"
        onClick={() => bootstrap.clearReportSession()}
      >
        Clear session
      </button>

      <ReportShareLinkDialog
        open={dialogOpen}
        link={dialogLink}
        humanLines={dialogLines}
        error={dialogError}
        busy={shareBusy}
        onClose={() => setDialogOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => !deleteBusy && setDeleteOpen(false)}
        title="Delete report from worker?"
        description={
          hostedId ?
            `Permanently remove report ${hostedId} from the worker. This cannot be undone.`
          : 'Remove this report from the worker.'
        }
        confirmLabel="Delete report"
        variant="danger"
        titleIcon={<IconAlertTriangle />}
        busy={deleteBusy}
        onConfirm={async () => {
          if (!hostedId) return;
          setDeleteBusy(true);
          const result = await deleteWorkerReport(readWorkerUrl(), hostedId);
          setDeleteBusy(false);
          if (!result.ok) {
            toast.error(result.issue.message);
            return;
          }
          removeShareHistoryEntry(hostedId);
          if (result.issue) toast.message(result.issue.message);
          else toast.success('Report deleted from the worker.');
          clearWorkerAssociation();
          setDeleteOpen(false);
          setDialogOpen(false);
        }}
      />
    </>
  );
}
