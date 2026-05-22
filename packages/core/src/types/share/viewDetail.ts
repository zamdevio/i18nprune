/** One key=value block in share view verbose output (`--verbose` / `--json`). */
export type ShareViewVerboseSection = Record<string, string | number | boolean>;

/** Structured sections returned on `share view --verbose` (human + JSON `verbose` field). */
export type ShareViewVerboseDetail = {
  kind: 'project' | 'report';
  workerId: string;
  processor: ShareViewVerboseSection;
  extraction?: ShareViewVerboseSection;
  snapshot?: ShareViewVerboseSection;
  cache?: ShareViewVerboseSection;
  timings?: ShareViewVerboseSection;
  edge?: ShareViewVerboseSection;
  local?: ShareViewVerboseSection;
  links: ShareViewVerboseSection;
};
