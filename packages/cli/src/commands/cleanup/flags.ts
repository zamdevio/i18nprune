/** True when CLI `--rg` enables ripgrep string-presence probes (opt-in). */
export function resolveCleanupRg(opts: { rg?: boolean }): boolean {
  return opts.rg === true;
}
