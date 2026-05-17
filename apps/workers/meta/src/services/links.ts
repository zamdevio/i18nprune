import { DEFAULT_LINKS } from "../constants/urls";
import type { WorkerEnv } from "../types";

/** Curated links for `/v1/meta`. Env may later supply JSON overrides. */
export function buildLinks(_env: WorkerEnv): Record<string, string> {
  void _env;
  return { ...DEFAULT_LINKS };
}
