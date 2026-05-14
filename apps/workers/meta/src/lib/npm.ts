import {
  NPM_CORE_DEFAULT,
  NPM_CLI_DEFAULT,
  NPM_EXTENSION_DEFAULT,
  NPM_REGISTRY_ORIGIN,
} from "../constants/npm";
import type { NpmBundlePayload, NpmPackageInfo, WorkerEnv } from "../types";

function registryLatestUrl(packageName: string): string {
  const path = encodeURIComponent(packageName);
  return `${NPM_REGISTRY_ORIGIN}/${path}/latest`;
}

export async function fetchNpmLatest(packageName: string): Promise<NpmPackageInfo> {
  const name = packageName;
  try {
    const res = await fetch(registryLatestUrl(name), {
      headers: {
        Accept: "application/json",
        "User-Agent": "i18nprune-github-worker",
      },
    });
    if (!res.ok) {
      return {
        name,
        version: null,
        lastPublishUnix: null,
        registryError: `npm HTTP ${res.status}`,
      };
    }
    const json = (await res.json()) as {
      version?: unknown;
      time?: { modified?: string; [version: string]: string | undefined };
    };
    const version = typeof json.version === "string" ? json.version : null;
    let lastPublishUnix: number | null = null;
    const modified = json.time?.modified;
    if (typeof modified === "string") {
      const t = Date.parse(modified);
      if (Number.isFinite(t)) lastPublishUnix = Math.floor(t / 1000);
    }
    return {
      name,
      version,
      lastPublishUnix,
      registryError: null,
    };
  } catch (error) {
    return {
      name,
      version: null,
      lastPublishUnix: null,
      registryError: error instanceof Error ? error.message : String(error),
    };
  }
}

export function resolveNpmPackageNames(env: WorkerEnv): {
  cli: string;
  core: string;
  extension: string;
} {
  return {
    cli: env.NPM_CLI_PACKAGE?.trim() || NPM_CLI_DEFAULT,
    core: env.NPM_CORE_PACKAGE?.trim() || NPM_CORE_DEFAULT,
    extension: env.NPM_EXTENSION_PACKAGE?.trim() || NPM_EXTENSION_DEFAULT,
  };
}

export async function fetchNpmBundle(env: WorkerEnv): Promise<NpmBundlePayload> {
  const names = resolveNpmPackageNames(env);
  const [cli, core, extension] = await Promise.all([
    fetchNpmLatest(names.cli),
    fetchNpmLatest(names.core),
    fetchNpmLatest(names.extension),
  ]);
  return { cli, core, extension };
}
