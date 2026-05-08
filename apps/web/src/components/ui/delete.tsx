import { useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

type DeleteConfirmButtonProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  triggerLabel?: string;
  triggerClassName?: string;
  disabled?: boolean;
  previewItems?: string[];
  previewMoreCount?: number;
  onConfirm: () => Promise<void> | void;
  children?: ReactNode;
};

export function DeleteConfirmButton({
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  triggerLabel,
  triggerClassName,
  disabled,
  previewItems,
  previewMoreCount,
  onConfirm,
  children,
}: DeleteConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {children ? (
        <span
          className={triggerClassName}
          aria-disabled={disabled ? 'true' : 'false'}
          onClick={() => !disabled && setOpen(true)}
        >
          {children}
        </span>
      ) : (
        <button type="button" disabled={disabled} className={triggerClassName} onClick={() => setOpen(true)}>
          {triggerLabel ?? confirmLabel}
        </button>
      )}

      {open ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel modal-panel--danger" role="dialog" aria-modal aria-labelledby="delete-confirm-title">
            <div className="modal-panel__head">
              <h2 id="delete-confirm-title">
                <AlertTriangle size={18} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
                {title}
              </h2>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>{description}</p>
            {previewItems && previewItems.length > 0 ? (
              <div className="delete-preview">
                {previewItems.map((item) => (
                  <div key={item} className="delete-preview__item">
                    {item}
                  </div>
                ))}
                {(previewMoreCount ?? 0) > 0 ? (
                  <div className="delete-preview__more">... +{String(previewMoreCount)} more</div>
                ) : null}
              </div>
            ) : null}
            {error ? <p className="error-text">{error}</p> : null}
            <div className="modal-panel__foot">
              <button type="button" disabled={busy} onClick={() => setOpen(false)}>
                {cancelLabel}
              </button>
              <button type="button" className="danger" disabled={busy} onClick={() => void confirm()}>
                {busy ? 'Working…' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
