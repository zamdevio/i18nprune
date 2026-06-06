export interface GitBranch {
  name: string;
  hash: string;
  shortHash: string;
  date: string;
  subject: string;
  isCurrent: boolean;
  totalCommits: number;
  authors: number;
  authorEmails: string[];
  insertions: number;
  deletions: number;
  netLines: number;
  activeDays: number;
  firstCommit: string;
  lastCommit: string;
}
