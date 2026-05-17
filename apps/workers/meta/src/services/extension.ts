import { EXTENSION_NAME, EXTENSION_PUBLISHER } from "../constants/extension";
import type { ExtensionRowV1 } from "../types";

const GALLERY_URL =
  "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery?api-version=7.1-preview.1";

/**
 * VS Code Marketplace as canonical extension version source.
 */
export async function fetchVsCodeMarketplaceExtension(
  publisher: string,
  name: string,
): Promise<ExtensionRowV1> {
  const base: ExtensionRowV1 = {
    publisher,
    name,
    version: null,
    lastPublishUnix: null,
    error: null,
  };

  try {
    const res = await fetch(GALLERY_URL, {
      method: "POST",
      headers: {
        Accept: "application/json;api-version=7.1-preview.1",
        "Content-Type": "application/json",
        "User-Agent": "i18nprune-meta-worker",
      },
      body: JSON.stringify({
        filters: [
          {
            criteria: [{ filterType: 7, value: `${publisher}.${name}` }],
            pageNumber: 1,
            pageSize: 1,
          },
        ],
        flags: 914,
      }),
    });

    if (!res.ok) {
      return { ...base, error: `marketplace HTTP ${res.status}` };
    }

    const json = (await res.json()) as {
      results?: { extensions?: unknown[] }[];
    };
    const ext = json.results?.[0]?.extensions?.[0] as
      | {
          versions?: { version?: string; lastUpdated?: string }[];
        }
      | undefined;

    const v0 = ext?.versions?.[0];
    const version = typeof v0?.version === "string" ? v0.version : null;
    let lastPublishUnix: number | null = null;
    if (typeof v0?.lastUpdated === "string") {
      const t = Date.parse(v0.lastUpdated);
      if (Number.isFinite(t)) lastPublishUnix = Math.floor(t / 1000);
    }

    if (!ext || !ext.versions?.length) {
      return { ...base, error: "extension not found in marketplace" };
    }

    return { publisher, name, version, lastPublishUnix, error: null };
  } catch (error) {
    return {
      ...base,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function fetchExtensionRow(): Promise<ExtensionRowV1> {
  return fetchVsCodeMarketplaceExtension(EXTENSION_PUBLISHER, EXTENSION_NAME);
}
