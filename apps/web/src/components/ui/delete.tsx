import { useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ConfirmDialog } from '@i18nprune/ui/react/overlay';

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

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant="danger"
        titleIcon={
          <AlertTriangle size={18} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} aria-hidden />
        }
        previewItems={previewItems}
        previewMoreCount={previewMoreCount}
        busy={busy}
        error={error}
        onConfirm={confirm}
      />
    </>
  );
}
