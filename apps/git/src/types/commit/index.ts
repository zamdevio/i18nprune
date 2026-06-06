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
}
