import type { ProjectPrepareMeta } from './prepare.js';

export type PrepareTimerMark = 'zipParsed' | 'analysisDone' | 'extractionDone';

export type PrepareTimer = {
  mark(label: PrepareTimerMark): void;
  finish(prepareHost?: string): ProjectPrepareMeta;
};
