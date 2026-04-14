# `missing`

Adds **dotted key paths** that appear in **translation calls** in your source tree but are **absent** from the JSON file you choose (by default the **source locale** file — the same one **`validate`** checks against).

## Write target: `--locale` or source locale

Before **writing** (not **`--dry-run`**), the CLI shows a **path preview** (see **`--top`** / **`--full-list`**) and asks for **confirmation** in an interactive TTY unless you pass global **`--yes`**. In **non-interactive** environments (no TTY, **`CI`**, piped stdin), a real write **requires** **`--yes`** or the command exits with a usage error — same idea as **`cleanup`**.

| User input | Write target |
|------------|----------------|
| **`--locale <code>`** passed | **`locales/<code>.json`** under **`localesDir`** (same resolution as **`sync`** / **`fill`**). The CLI **warns** if this is **not** the **source locale** file: **`validate`** may still report gaps in the **source locale** until you align files. |
| **`--locale` omitted** | The **source locale** file — `config.source` resolved (the file **`validate`** checks against). |

The **scan** (which keys the code references) is always the same; only the **file** that receives new paths changes.

## Preconditions (fail fast)

Before merging, the command must have a usable filesystem target:

- **`localesDir`** must exist (resolved from config) when you need it — e.g. for **`--locale`**, or when the **source locale** path lives under that directory in your layout.
- The **output file** must be writable (create parent dirs only if the product decision says so — otherwise fail with a clear error).

If the **source locale** file is **missing** when it is the chosen target, or **`localesDir`** is **missing** when required, exit **non-zero** with an actionable message — same spirit as other commands that require paths on disk. No prompts to “fix” this in v1.

```bash
i18nprune missing --yes
i18nprune missing --dry-run
i18nprune missing --dry-run --top 5
i18nprune missing --locale ja --yes
i18nprune missing --from-report report.json --yes
i18nprune validate --json > report.json && i18nprune missing --from-report report.json --yes
```

**Does not** call translation APIs. It only **merges placeholder** string values (default **`""`**) for missing paths.

## End-to-end flow

1. **Load config** — `source`, `localesDir`, `src`, `functions`, optional `missing` / `validate` namespaces (see [Command namespaces in config](../../config/commands.md)).
2. **Resolve write target** — absolute path to **`config.source`** or **`locales/<code>.json`** (see table above). If the file is missing and the target may be created, start from **`{}`**.
3. **Read** that JSON and collect existing **string leaf** paths (nested objects that are not string leaves do not count as “present” for a dotted key).
4. **Scan** `src` for translation calls and extract **literal** key strings (same pipeline as **`validate`**).
5. **Compute `toAdd`** — literals in code that are not yet string leaves in the target file (or intersect **`--from-report`** with the current scan when that flag is set).
6. **Human mode, real write:** print preview (respecting **`--top`** / **`--full-list`** / env / config defaults), then **confirm** unless **`--yes`** or non-interactive rules apply; on success, merge **`""`** at each path and **write** the file.
7. **`--dry-run` / `--json`** — no write; **`--json`** prints the full **`paths`** array.

## Config and environment

| Mechanism | Role |
|-----------|------|
| **`config.source`**, **`localesDir`**, **`src`**, **`functions`** | Required; define which file is updated and what counts as a translation call. |
| **`config.missing.displayDefaultTop`** | Default human listing cap when **`--top`** is omitted (see [Command namespaces](../../config/commands.md)). |
| **`MISSING_DISPLAY_DEFAULT_TOP`** | Env override for that same default cap (valid positive integer). |
| **`CI`** | With other rules, suppresses interactive **confirmation** in automation; use **`--yes`** to write. |

Invalid env values for **`MISSING_DISPLAY_DEFAULT_TOP`** are ignored (fallback to config, then **10**).

## How it works

1. **Scan** the project (`src`, **`functions`**) the same way **`validate`** does.
2. **Compute** which literal keys appear in code but are **not** yet present in the **chosen JSON file** (the **source locale** file by default, or **`locales/<locale>.json`** when **`--locale`** is set).
3. **Merge** those paths into that file with placeholders.
4. **Write** the file (unless **`--dry-run`**).

**Default vs `--locale`**

- **Default (source locale file):** The paths match what **`validate`** calls “missing” (code vs **source locale** JSON). **`--from-report`** from **`validate --json`** applies cleanly.
- **`--locale <code>`:** The paths are “in code but not in **this** file” — they can **differ** from **`validate`’s** list whenever the **source locale** and that locale are out of sync (e.g. after **`missing`** on source but before **`sync`**). Prefer **`--from-report`** with the default target when you want a 1:1 with **`validate`**.

## Recommended pipeline (source locale default)

When you use the **default** (update **source locale** only):

1. **`missing`** — **source locale** JSON gains keys the code references.
2. **`sync`** — other locale files under **`localesDir`** match the **source locale** shape.
3. **`fill`** — **re-translate** leaves in target locales that still **match the source locale** string (stale English-identical copies). **`fill`** does not invent keys; it **re-translates** existing paths.
4. **`validate`** — confirm code vs **source locale** JSON.
5. **`quality`** / **`review`** — parity and per-locale review.

When you used **`--locale <code>`** instead, **`sync`** / **`fill`** / **`validate`** still follow the same roles: **`validate`** is defined against the **source locale** file, so keep that file in sync before relying on a green **`validate`** for the whole project.

## Flags

**`missing`-specific**

| Flag | Role |
|------|------|
| **`--locale <code>`** | Write into **`locales/<code>.json`** instead of the **source locale** file. Optional. Normalized like other commands (e.g. **`pt-br`**). |
| **`--dry-run`** | List paths that **would** be added; **no** file write. Preview uses **`--top`** / **`--full-list`**. |
| **`--from-report <file>`** | Read the **`missing`** array from a **`validate --json`** document (or compatible shape). |
| **`--top <n>`** | Human listings show at most **`n`** paths. Default cap if omitted: **`MISSING_DISPLAY_DEFAULT_TOP`** env → **`config.missing.displayDefaultTop`** → **10**. Ignored with **`--full-list`**. Must be a **positive integer** (same validation as **`review --top`**). |
| **`--full-list`** | Human listings print **every** path (overrides **`--top`**). |

**Global (same as other commands)**

| Flag | Role |
|------|------|
| **`--report-file`**, **`--report-format`** | Structured run report at end (when this command is wired into the report session). See [Examples](../../examples/README.md). |
| **`-q` / `-s`**, **`--json`** | Verbosity and machine-readable mode; see [JSON & long runs](../../behavior/json-long.md). |
| **`--yes`** (global) | Skip the write **confirmation** and proceed (required for non-interactive writes). |

## CI / `--json` / non-interactive

- **`--locale`** is optional; if omitted, the **source locale** file is the target (see table above).
- **Global `--json`:** Machine-readable stdout; **no** confirmation prompt. The **`paths`** array is always **complete** (not capped by **`--top`**).
- **Writes without a TTY:** use **`--yes`** (or **`--dry-run`** to preview only). Otherwise the command fails with a clear **`USAGE`** message.
- **Missing paths on disk:** See **Preconditions** — fail fast.

## Troubleshooting

- **Answering “No” at confirmation** exits **0** with a note — the command **did** run; no file was changed. This is not a bug.
- **`i18nprune missing -`** — a lone **`-`** is not a supported flag; pass **`--dry-run`**, **`--top`**, etc. explicitly.
- **Ctrl+C at the prompt** exits non-zero (`User force closed the prompt with SIGINT`) — expected.
- **After a successful write, the next run still lists the same paths:** the tool only treats a key as present if it exists as a **string leaf** in the **exact** JSON file shown in the log. Check: **`config.source`** (or **`--locale`**) points at the file your app loads, the file on disk saved (not reverted by another process), and **`i18nprune validate --json`** shows **`missing: []`** for that file. Mixed **object vs string** at a path can make the key look “still missing.”

## Relation to other commands

| Command | Role |
|---------|------|
| **`validate`** | Read-only; compares code to **source locale** JSON and lists **missing** + **dynamic** sites. |
| **`missing`** | **Writes** placeholders into **source locale** JSON by default, or into **`locales/<locale>.json`** with **`--locale`**. |
| **`sync`** | Aligns **non-source** locale files to the **source locale** shape. |
| **`fill`** | **Re-translates** string leaves in a **target** locale that still **match the source locale** value (does not add new key paths). |
| **`generate`** | Builds a **new target** locale from the **source locale** via the translator — different from **`missing`**. |

## See also

- [validate](../validate/README.md)
- [sync](../sync/README.md)
- [fill](../fill/README.md)
- [generate](../generate/README.md)
- [CLI overview](../../cli/README.md)
- [Exit codes & behavior](../../behavior/README.md)
