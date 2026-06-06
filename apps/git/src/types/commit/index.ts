export interface FileStat {
  path: string;
  insertions: number;
  deletions: number;
}

export type CommitType = 'feat' | 'chore' | 'docs' | 'refactor' | 'fix' | 'test' | 'ci';

export interface Commit {
  hash: string;
  fullHash: string;
  date: string;
  week: string;
  type: CommitType;
  scope: string;
  subject: string;
  body: string;
  author: string;
  email: string;
  insertions: number;
  deletions: number;
  filesChanged: number;
  files: string[];
  fileStats: FileStat[];
  tags: string[];
  branches: string[];
  branch: string | null;
}
