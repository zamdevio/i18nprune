import { useMeta } from "../context/MetaContext";

/** GitHub repo stats from the same `/v1/meta` snapshot as links + CLI version. */
export function useGitHub() {
  return useMeta().github;
}
