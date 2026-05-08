export function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function codeSet(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort();
}
