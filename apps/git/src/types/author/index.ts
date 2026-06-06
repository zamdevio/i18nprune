export type { AuthorProfileStats } from './profile';
export interface Author {
  username: string;
  name: string;
  email: string;
  commits: number;
  insertions: number;
  deletions: number;
  firstCommit: string;
  lastCommit: string;
  githubLogin: string | null;
  githubUrl: string;
  displayName: string;
  avatarUrl: string | null;
  followers: number | null;
  following: number | null;
  bio: string | null;
}
