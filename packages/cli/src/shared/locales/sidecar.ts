/**
 * Skip writing **`<lang>.meta.json`** when the CLI flag **or** config requests it (either **`true`** wins).
 * Precedence is equivalent to **`--no-locale-meta` OR `config.noLocaleMeta`**.
 */
export function shouldSkipLocaleMetaSidecar(
  opts: { noLocaleMeta?: boolean },
  config: { noLocaleMeta?: boolean },
): boolean {
  return opts.noLocaleMeta === true || config.noLocaleMeta === true;
}
