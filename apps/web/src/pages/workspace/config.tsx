import { DeleteConfirmButton } from '../../components/ui/delete';
import { UploadPerfBadge } from '../../components/UploadPerfBadge';
import type { WorkspaceConfigHintState } from '@i18nprune/core';

type Props = {
  isRemote: boolean;
  busy: boolean;
  activeZipFile: File | undefined;
  configJson: string;
  onConfigJsonChange: (value: string) => void;
  configHint: WorkspaceConfigHintState;
  overrideApplied: boolean;
  latestUploadMeta: { preparedAt?: string; extractionComputedAt?: string };
  onReprocess: () => void;
  onClearOverride: () => void;
};

export function Config({
  isRemote,
  busy,
  activeZipFile,
  configJson,
  onConfigJsonChange,
  configHint,
  overrideApplied,
  latestUploadMeta,
  onReprocess,
  onClearOverride,
}: Props) {
  return (
    <section className="panel">
      <h2>{isRemote ? 'Remote config override' : 'Local config override'}</h2>
      <div className="row">
        <label className="field field-wide">
          configJson (optional — partial merge onto zip config)
          <textarea
            value={configJson}
            onChange={(e) => onConfigJsonChange(e.target.value)}
            placeholder='{"locales":{"source":"locales/en.json","directory":"locales"}} — merged with zip config; leave empty to use zip only'
          />
        </label>
      </div>
      <p className="muted">
        {isRemote ? (
          <>
            Remote project + active zip in memory: <code>{activeZipFile?.name ?? 'missing'}</code>. This temporary zip is cleared on browser
            reload or when you click <strong>Clear session</strong>.
          </>
        ) : (
          <>
            Local session uses the same active zip in memory: <code>{activeZipFile?.name ?? 'missing'}</code>. Apply configJson to rebuild
            local extraction without switching mode.
          </>
        )}
      </p>
      <div className="row">
        <button className="primary" disabled={busy || !activeZipFile || !configHint.ok} type="button" onClick={onReprocess}>
          {isRemote ? 'Apply override + re-upload' : 'Apply override + rebuild local'}
        </button>
        {overrideApplied ? (
          <DeleteConfirmButton
            title="Clear config override and rebuild?"
            description="This removes the override, deletes the current worker project, then re-uploads with force ingest (replaces any prior row for the same payload hash)."
            confirmLabel="Clear override + rebuild"
            triggerClassName="danger"
            triggerLabel="Clear override + rebuild"
            onConfirm={onClearOverride}
          />
        ) : null}
        {isRemote ? (
          <UploadPerfBadge preparedAt={latestUploadMeta.preparedAt} extractionComputedAt={latestUploadMeta.extractionComputedAt} />
        ) : null}
      </div>
      <div
        className={`config-validator config-validator--${
          configHint.kind === 'checking' || configHint.kind === 'idle' ? 'empty' : configHint.kind
        }`}
      >
        <strong>Config check:</strong> {configHint.message}
      </div>
    </section>
  );
}
