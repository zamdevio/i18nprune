import type { CompatEntry } from '../compat/index.js';
import type { StreamId } from '../stream/index.js';

export type ReleaseStatus = 'stable' | 'prerelease' | 'deprecated';

export type ReleaseSections = {
  added: string[];
  changed: string[];
  fixed: string[];
  removed: string[];
  breaking: string[];
  security: string[];
  performance: string[];
};

export type ReleaseRecordV1 = {
  schemaVersion: 1;
  stream: StreamId;
  version: string;
  date: string;
  status: ReleaseStatus;
  summary: string;
  highlights?: string[];
  sections: ReleaseSections;
  migration: {
    notes: string[];
    docLinks?: { label: string; href: string }[];
  };
  npm: {
    package: string;
    installSnippet: string;
  };
  git: {
    tag: string;
    githubReleaseUrl?: string;
  };
  compat?: CompatEntry[];
  tags?: string[];
};
