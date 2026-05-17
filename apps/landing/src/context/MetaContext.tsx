import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FALLBACK_CLI_VERSION,
  FALLBACK_LINKS,
  fetchMetaV1,
  mergeLinks,
  type MetaV1Ok,
} from "../lib/meta";
import { emptyGitHubMeta, githubPayloadToRepoMeta, type GitHubRepoMeta } from "../lib/github";

export type MetaContextValue = {
  links: Record<string, string>;
  cliVersion: string;
  github: GitHubRepoMeta | null;
  loading: boolean;
};

const MetaContext = createContext<MetaContextValue | null>(null);

export function MetaProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<MetaV1Ok | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMetaV1().then((s) => {
      if (!cancelled) {
        setSnap(s);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<MetaContextValue>(() => {
    const links = mergeLinks(snap?.links);
    const cliVersion =
      snap?.npm?.cli?.version && snap.npm.cli.version.length > 0
        ? snap.npm.cli.version
        : FALLBACK_CLI_VERSION;
    const github: GitHubRepoMeta | null = loading
      ? null
      : snap?.ok === true
        ? githubPayloadToRepoMeta(snap.github)
        : emptyGitHubMeta("Meta worker unavailable");
    return { links, cliVersion, github, loading };
  }, [snap, loading]);

  return <MetaContext.Provider value={value}>{children}</MetaContext.Provider>;
}

export function useMeta(): MetaContextValue {
  const ctx = useContext(MetaContext);
  if (!ctx) {
    throw new Error("useMeta must be used within MetaProvider");
  }
  return ctx;
}
