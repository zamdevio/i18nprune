import type { MetaV1Body } from "../types";

export type V1Part = "meta" | "github" | "npm" | "extension";

export function sliceMetaV1(full: MetaV1Body, part: V1Part): Record<string, unknown> {
  const base = {
    ok: true as const,
    version: full.version,
    generatedAtUnix: full.generatedAtUnix,
  };

  switch (part) {
    case "meta":
      return full;
    case "github":
      return { ...base, cache: { github: full.cache.github }, github: full.github };
    case "npm":
      return { ...base, cache: { npm: full.cache.npm }, npm: full.npm };
    case "extension":
      return { ...base, cache: { extension: full.cache.extension }, extension: full.extension };
  }
}
