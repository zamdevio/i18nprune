export interface Summary {
  totalCommits: number;
  activeDays: number;
  calendarDays: number;
  authors: number;
  tsFiles: number;
  tsSourceLines: number;
  mdLines: number;
  netLinesAdded: number;
  firstCommit: string;
  lastCommit: string;
  tags: string[];
  topCommitDay: { date: string; count: number };
}
