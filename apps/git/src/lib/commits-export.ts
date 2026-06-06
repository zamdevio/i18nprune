import type { Commit } from '../types';

export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function commitsToCsv(commits: Commit[]): string {
  const header = [
    'hash',
    'date',
    'week',
    'type',
    'scope',
    'subject',
    'author',
    'email',
    'insertions',
    'deletions',
    'filesChanged',
  ];
  const rows = commits.map((commit) =>
    [
      commit.hash,
      commit.date,
      commit.week,
      commit.type,
      commit.scope,
      commit.subject,
      commit.author,
      commit.email,
      commit.insertions,
      commit.deletions,
      commit.filesChanged,
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}
