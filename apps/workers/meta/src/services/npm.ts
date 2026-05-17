import { NPM_CLI_DEFAULT, NPM_CORE_DEFAULT, NPM_REGISTRY_ORIGIN } from "../constants/npm";
import type { NpmRowV1, WorkerEnv } from "../types";

function registryLatestUrl(packageName: string): string {
  return `${NPM_REGISTRY_ORIGIN}/${encodeURIComponent(packageName)}/latest`;
}

export async function fetchNpmRow(packageName: string): Promise<NpmRowV1> {
  const name = packageName;
  try {
    const res = await fetch(registryLatestUrl(name), {
      headers: {
        Accept: "application/json",
        "User-Agent": "i18nprune-meta-worker",
      },
    });
    if (!res.ok) {
      return {
        name,
        version: null,
        lastPublishUnix: null,
        error: `npm HTTP ${res.status}`,
      };
    }
    const json = (await res.json()) as {
      version?: unknown;
      time?: { modified?: string };
    };
    const version = typeof json.version === "string" ? json.version : null;
    let lastPublishUnix: number | null = null;
    const modified = json.time?.modified;
    if (typeof modified === "string") {
      const t = Date.parse(modified);
      if (Number.isFinite(t)) lastPublishUnix = Math.floor(t / 1000);
    }
    return { name, version, lastPublishUnix, error: null };
  } catch (error) {
    return {
      name,
      version: null,
      lastPublishUnix: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function resolveNpmPackageNames(env: WorkerEnv): { cli: string; core: string } {
  return {
    cli: env.NPM_CLI_PACKAGE?.trim() || NPM_CLI_DEFAULT,
    core: env.NPM_CORE_PACKAGE?.trim() || NPM_CORE_DEFAULT,
  };
}

export async function fetchNpmCliCore(env: WorkerEnv): Promise<{ cli: NpmRowV1; core: NpmRowV1 }> {
  const names = resolveNpmPackageNames(env);
  const [cli, core] = await Promise.all([fetchNpmRow(names.cli), fetchNpmRow(names.core)]);
  return { cli, core };
}
