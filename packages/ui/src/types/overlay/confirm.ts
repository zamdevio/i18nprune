import type { ReactNode } from 'react';

export type ConfirmDialogVariant = 'default' | 'danger';

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  titleIcon?: ReactNode;
  previewItems?: string[];
  previewMoreCount?: number;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => Promise<void> | void;
};
