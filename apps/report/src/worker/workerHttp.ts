function workerNetworkErrorBody(err: unknown): { success: false; errors: Array<{ code: string; message: string }> } {
  const message = err instanceof Error ? err.message : String(err);
  return { success: false, errors: [{ code: 'NETWORK_ERROR', message }] };
}

function parseWorkerResponseBody(text: string): unknown {
  if (text.length === 0) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      success: false,
      errors: [{ code: 'WORKER_BODY_INVALID', message: 'Worker response was not valid JSON.' }],
    };
  }
}

/** Copy zip bytes into an `ArrayBuffer` for `Blob` / `File` (TS `BlobPart` vs `ArrayBufferLike`). */
export function zipBytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/** Raw worker HTTP for core `share/remote` envelope parsing (no thrown errors). */
export async function workerFetchJson(url: string, init?: RequestInit): Promise<{ httpStatus: number; body: unknown }> {
  try {
    const resp = await fetch(url, init);
    const text = await resp.text();
    return { httpStatus: resp.status, body: parseWorkerResponseBody(text) };
  } catch (err) {
    return { httpStatus: 0, body: workerNetworkErrorBody(err) };
  }
}
