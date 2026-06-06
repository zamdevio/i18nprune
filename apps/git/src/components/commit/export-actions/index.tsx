import { useState } from 'react';
import type { Commit } from '../../../types';
import { copyText } from '../../../lib/clipboard';
import { commitsToCsv, downloadText } from '../../../lib/commits-export';
import styles from './index.module.css';

interface ExportActionsProps {
  commits: Commit[];
}

export function ExportActions({ commits }: ExportActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = async (): Promise<void> => {
    const ok = await copyText(JSON.stringify(commits, null, 2));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadJson = (): void => {
    downloadText('commits.json', JSON.stringify(commits, null, 2), 'application/json');
  };

  const handleDownloadCsv = (): void => {
    downloadText('commits.csv', commitsToCsv(commits), 'text/csv');
  };

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.btn} onClick={() => void handleCopyJson()}>
        {copied ? 'Copied' : 'Copy JSON'}
      </button>
      <button type="button" className={styles.btn} onClick={handleDownloadJson}>
        Download JSON
      </button>
      <button type="button" className={styles.btn} onClick={handleDownloadCsv}>
        Download CSV
      </button>
    </div>
  );
}
