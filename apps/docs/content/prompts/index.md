# Prompts and CLI boundaries

Where **Inquirer** (or other interactive prompts) may appear, how they interact with **`--json`**, **non-TTY**, and **CI**, and how that differs from **utils** that should stay prompt-free.

## Principles

1. **Commands orchestrate I/O** — `packages/cli/src/commands/**/run.ts` (and the root `bin/cli.ts` hooks) decide when to prompt, when to skip, and when to emit **structured JSON** on stdout.
2. **Utils return data or log** — helpers under `packages/cli/src/utils/**` should not call **`@inquirer/prompts`** except where explicitly documented (known debt: report file collision resolution — see below).
3. **Config resolution** — duplicate `i18nprune.config.*` selection and **`init`** format prompts live in `packages/cli/src/config/**` with **`shouldSkipInteractivePrompts()`** and global **`--json`** / **`--yes`** handling (see [Behavior: interactivity](../behavior)).
4. **`--json` means “no surprises on stdin”** — global **`--json`** forces non-interactive duplicate-config resolution; implicit config bootstrap matches **`--yes`** when no config exists; commands that emit JSON should prefer **`issues[]`** in the stdout envelope over stderr-only errors when work cannot complete (see [Issue codes](../issues)).

## When prompts are skipped

| Mechanism | Effect |
|-----------|--------|
| No TTY (`stdin` not a TTY) | **`shouldSkipInteractivePrompts()`** is true — no Inquirer prompts in **`init`**, duplicate-config pick, etc. |
| `CI=1` or `CI=true` | Same as above. |
| `I18NPRUNE_NO_INIT=1` | Same as above (init-oriented; see env docs). |
| Global **`--json`** | Duplicate config: must use **`-c` / `--config`**; missing config file: default write without format picker; **`generate`** / **`fill`** use non-interactive rules. |
| Global **`--yes`** | **`init`**: write default config without prompts. |

## Report / `stdout redirection` path collisions

**`utils/report/index.ts`** — `resolveReportOutputPath` only calls **`select(...)`** when the run is **interactive**. If **`getCliYesFlag()`**, **`shouldSkipInteractivePrompts()`**, or **`getRunOptions().json`** is true, it **keeps both** (suffixed path) with **no prompt**, so **`--json`** and CI never block on overwrite menus. Details: [report command — existing paths](../commands/report#existing-output-paths-report--out-and-global-stdout redirection).

## Related docs

- [Behavior: exit codes and interactivity](../behavior)
- [Config](../config)
- [Issue codes (`issues[]`)](../issues)
- [JSON output](../json)
