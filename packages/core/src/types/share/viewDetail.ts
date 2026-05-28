/** One key=value block in share view verbose output (`--verbose` / `--json`). */
export type ShareViewVerboseSectionValue = string | number | boolean | null | readonly string[];
export type ShareViewVerboseSection = Record<string, ShareViewVerboseSectionValue>;

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
