/** Commander maps `--no-rg` to `{ rg: false }`, not `{ noRg: true }`. */
export function resolveCleanupNoRg(opts: { rg?: boolean; noRg?: boolean }): boolean {
  return opts.rg === false || opts.noRg === true;
}
