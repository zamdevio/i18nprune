import type { Issue } from '../json/envelope/index.js';

export type DeleteTargetResult = {
  target: string;
  /** Segment paths removed for this locale code (e.g. `app/ar.json`). */
  deletedSegmentRelativePaths: string[];
  deletedJsonCount: number;
};

export type DeleteJsonPayload = {
  kind: 'locales-delete';
  targets: string[];
  /** JSON segment files removed on disk. */
  deletedJson: number;
  /** Distinct locale codes that had at least one segment file removed. */
  deletedLocaleCount: number;
  aborted: boolean;
  supportsAutoPatching: false;
};

export type DeleteRunResult = {
  payload: DeleteJsonPayload;
  issues: Issue[];
  deletedTargets: DeleteTargetResult[];
};
