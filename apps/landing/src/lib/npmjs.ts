import { NPM_PACKAGE_NAME } from "../constants/links";
import { safeFetchJson } from "./http";

/** Latest `dist-tags.latest` from the registry, or `null` on failure. */
export async function fetchLatestPublishedVersion(): Promise<string | null> {
  const url = `https://registry.npmjs.org/${encodeURIComponent(NPM_PACKAGE_NAME)}/latest`;
  const res = await safeFetchJson<{ version?: unknown }>(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok || !res.data) return null;
  return typeof res.data.version === "string" ? res.data.version : null;
}
