/** Host-facing options for `runShare` upload (CLI maps Commander flags here; SDK/IDE pass fields directly). */
export type ShareUploadOptions = {
  project?: boolean;
  report?: boolean;
  /** Report JSON path when `report` is set (optional — hosts may scan in-process instead). */
  from?: string;
  workerUrl?: string;
  force?: boolean;
};

export type ShareListOptions = {
  /** Filter to one worker-hosted project id. */
  project?: string;
  /** Filter to one worker-hosted report id. */
  report?: string;
  workerUrl?: string;
};

export type ShareViewOptions = {
  project?: string;
  report?: string;
  workerUrl?: string;
};

export type ShareDeleteOptions = {
  project?: string;
  report?: string;
  workerUrl?: string;
  /** When true, skip `DELETE /v1/projects/:id` or `/v1/reports/:id` (local `share.json` only). */
  localOnly?: boolean;
};
