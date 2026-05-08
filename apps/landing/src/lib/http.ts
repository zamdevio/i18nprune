export type JsonFetchResult<T> = {
  ok: boolean;
  status: number | null;
  data: T | null;
  error: string | null;
};

/**
 * Fetch JSON safely without throwing on network or parse failures.
 */
export async function safeFetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs: number = 8000,
): Promise<JsonFetchResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `HTTP ${res.status}`,
      };
    }

    try {
      const data = (await res.json()) as T;
      return {
        ok: true,
        status: res.status,
        data,
        error: null,
      };
    } catch {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: "Invalid JSON response",
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        status: null,
        data: null,
        error: "Request timeout",
      };
    }
    return {
      ok: false,
      status: null,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}
