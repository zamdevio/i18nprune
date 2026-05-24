import { useCallback, useId } from 'react';
import type { ConfirmDialogProps } from '../../types/overlay/index.js';

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  titleIcon,
  previewItems,
  previewMoreCount,
  busy = false,
  error = null,
  onConfirm,
}: ConfirmDialogProps): JSX.Element | null {
  const titleId = useId();

  const confirm = useCallback(async (): Promise<void> => {
    await onConfirm();
  }, [onConfirm]);

  if (!open) return null;

  const panelClass =
    variant === 'danger' ? 'modal-panel modal-panel--danger' : 'modal-panel';

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-panel__head">
          <h2 id={titleId}>
            {titleIcon}
            {title}
          </h2>
        </div>
        <p className="modal-panel__description">{description}</p>
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
          <button type="button" disabled={busy} onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={variant === 'danger' ? 'danger' : undefined}
            disabled={busy}
            onClick={() => void confirm()}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
