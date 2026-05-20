/** 16-char hex id for ephemeral worker/web project sessions. */
export function hex16Id(): string {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('');
}
