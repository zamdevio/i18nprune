import styles from './index.module.css';

interface SyncStatusProps {
  syncedAt: string;
  className?: string;
  variant?: 'inline' | 'banner';
}

function formatSyncedAt(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function SyncStatus({ syncedAt, className, variant = 'inline' }: SyncStatusProps) {
  return (
    <p
      className={[
        styles.status,
        variant === 'banner' ? styles.banner : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      Data synced {formatSyncedAt(syncedAt)}
    </p>
  );
}
