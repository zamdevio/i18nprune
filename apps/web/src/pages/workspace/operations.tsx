import { DeleteConfirmButton } from '../../components/ui/delete';
import { deleteProject } from '../../lib/services/api/client';
import type { WorkspaceSession } from '../../types/workspace';
import { snapDoctor, snapLocTag, snapLocs, snapMetadata, snapMissing, snapReport, snapReview, snapSnapshot, snapTree, snapValidate } from '../../lib/workspace/snapOps';
import { OpPreview } from './op-preview';

type Props = {
  busy: boolean;
  session: WorkspaceSession;
  projectId: string;
  workerBaseUrl: string;
  missingTargetTag: string;
  onMissingTargetTagChange: (v: string) => void;
  localeTag: string;
  onLocaleTagChange: (v: string) => void;
  runAction: (label: string, action: () => Promise<unknown>, curlCommand?: string) => Promise<void>;
  onRemoteProjectDeleted: () => void;
  lastOpTitle: string;
  lastOpPayload: unknown | null;
};

export function Operations({
  busy,
  session,
  projectId,
  workerBaseUrl,
  missingTargetTag,
  onMissingTargetTagChange,
  localeTag,
  onLocaleTagChange,
  runAction,
  onRemoteProjectDeleted,
  lastOpTitle,
  lastOpPayload,
}: Props) {
  const base = workerBaseUrl.replace(/\/$/, '');

  return (
    <section className="panel">
      <h2>Read-only operations</h2>
      <p className="muted workspace-ops-lead">
        Same model as the worker: one <strong>snapshot</strong> per project. Remote tabs fetch it once via GET /snapshot; in-tab sessions already embed it.
        Read-only tools slice that object (and cache JSON per action) until <code>configJson</code> changes (debounced cache clear), you <strong>Reprocess</strong>,
        or you leave — then a new snapshot applies after the next open or upload.
      </p>
      <div className="workspace-ops-groups">
        <div className="workspace-ops-group">
          <h3 className="workspace-ops-group__title">Project snapshot</h3>
          <div className="grid workspace-ops-group__grid">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction('Metadata', () => snapMetadata(session, workerBaseUrl, projectId), session.mode === 'remote' ? `curl -sS "${base}/v1/projects/${projectId}"` : '')
              }
            >
              Metadata
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction('Tree', () => snapTree(session, workerBaseUrl, projectId), session.mode === 'remote' ? `curl -sS "${base}/v1/projects/${projectId}/tree"` : '')
              }
            >
              Tree
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction(
                  'Snapshot',
                  () => snapSnapshot(session, workerBaseUrl, projectId),
                  session.mode === 'remote' ? `curl -sS "${base}/v1/projects/${projectId}/snapshot"` : '',
                )
              }
            >
              Snapshot
            </button>
          </div>
        </div>

        <div className="workspace-ops-group">
          <h3 className="workspace-ops-group__title">Scan &amp; locales</h3>
          <div className="grid workspace-ops-group__grid">
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() =>
                void runAction(
                  'Validate',
                  () => snapValidate(session, workerBaseUrl, projectId),
                  session.mode === 'remote'
                    ? `curl -sS -X POST "${base}/v1/projects/${projectId}/validate" -H "Content-Type: application/json" -d '{}'`
                    : '',
                )
              }
            >
              Validate
            </button>
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() =>
                void runAction(
                  'Review',
                  () => snapReview(session, workerBaseUrl, projectId),
                  session.mode === 'remote'
                    ? `curl -sS -X POST "${base}/v1/projects/${projectId}/review" -H "Content-Type: application/json" -d '{}'`
                    : '',
                )
              }
            >
              Review
            </button>
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() =>
                void runAction(
                  'Report',
                  () => snapReport(session, workerBaseUrl, projectId),
                  session.mode === 'remote'
                    ? `curl -sS -X POST "${base}/v1/projects/${projectId}/report" -H "Content-Type: application/json" -d '{}'`
                    : '',
                )
              }
            >
              Report
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction(
                  'Locales',
                  () => snapLocs(session, workerBaseUrl, projectId),
                  session.mode === 'remote' ? `curl -sS "${base}/v1/projects/${projectId}/locales"` : '',
                )
              }
            >
              Locales
            </button>
          </div>
          <div className="workspace-ops-inline">
            <div className="inline-control workspace-ops-inline__control">
              <input
                value={missingTargetTag}
                onChange={(e) => onMissingTargetTagChange(e.target.value)}
                placeholder="missing target tag (optional)"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void runAction(
                    'Missing',
                    () => snapMissing(session, workerBaseUrl, projectId, missingTargetTag),
                    session.mode === 'remote'
                      ? `curl -sS -X POST "${base}/v1/projects/${projectId}/missing" -H "Content-Type: application/json" -d '${JSON.stringify(
                          missingTargetTag ? { targetTag: missingTargetTag } : {},
                        )}'`
                      : '',
                  )
                }
              >
                Missing
              </button>
            </div>
            <div className="inline-control workspace-ops-inline__control">
              <input value={localeTag} onChange={(e) => onLocaleTagChange(e.target.value)} placeholder="locale tag (en/id/ar)" />
              <button
                type="button"
                disabled={busy || !localeTag}
                onClick={() =>
                  void runAction(
                    'LocaleByTag',
                    () => snapLocTag(session, workerBaseUrl, projectId, localeTag),
                    session.mode === 'remote' ? `curl -sS "${base}/v1/projects/${projectId}/locales/${localeTag}"` : '',
                  )
                }
              >
                Locale By Tag
              </button>
            </div>
          </div>
        </div>

        <div className="workspace-ops-group">
          <h3 className="workspace-ops-group__title">Doctor</h3>
          <div className="grid workspace-ops-group__grid workspace-ops-group__grid--tight">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction(
                  'Doctor',
                  () => snapDoctor(session, workerBaseUrl, projectId),
                  session.mode === 'remote' ? `curl -sS "${base}/v1/projects/${projectId}/doctor"` : '',
                )
              }
            >
              Doctor
            </button>
          </div>
        </div>

        {session.mode === 'remote' ? (
          <div className="workspace-ops-group workspace-ops-group--danger">
            <h3 className="workspace-ops-group__title">Worker cache</h3>
            <DeleteConfirmButton
              title="Delete worker project?"
              description={`This removes project ${projectId} from the worker cache.`}
              confirmLabel="Delete project"
              triggerClassName="danger"
              triggerLabel="Delete Project"
              onConfirm={async () => {
                await deleteProject(workerBaseUrl, projectId);
                onRemoteProjectDeleted();
              }}
            />
          </div>
        ) : null}
      </div>

      <OpPreview title={lastOpTitle} payload={lastOpPayload} />
    </section>
  );
}
