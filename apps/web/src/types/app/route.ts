/** Parsed hash route (`#/path?query`). */
export type HashRoute = {
  path: string;
  searchParams: URLSearchParams;
};

/** Resolved app route for layout and workspace deep links. */
export type AppRoute = {
  path: string;
  workspaceProjectId: string | null;
};
