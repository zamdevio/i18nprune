# `missing`

**Full examples:** [missing examples](../../examples/commands/missing/README.md)

Adds **dotted key paths** that appear in **translation calls** in your source tree but are **absent** from the JSON file you choose (by default the **source locale** file — the same one **`validate`** checks against).

## Write target: `--target` or source locale

Before **writing** (not **`--dry-run`**), the CLI shows a **path preview** (see **`--top`** / **`--full`**) and asks for **confirmation** in an interactive TTY unless you pass global **`--yes`**. With multiple targets, confirmation is one target file at a time. In **non-interactive** environments (no TTY, **`CI`**, piped stdin), a real write **requires** **`--yes`** or the command exits with a usage error — same idea as **`cleanup`**.

| User input | Write target |
|------------|----------------|
| **`--target <code[,code]\|all>`** passed | Existing target locale file(s) under **`localesDir`**. Missing locale files are **warned and skipped**; near misses include suggestions when an existing locale/coded catalog match is clear. The command does not create new locale files. The CLI warns that **`validate`** still compares code to the **source locale** file until it matches. |
| **`--target` omitted** | The **source locale** file — `config.source` resolved (the file **`validate`** checks against). |

The **scan** (which keys the code references) is always the same; only the **file** that receives new paths changes.

## Preconditions (fail fast)

Before merging, the command must have a usable filesystem target:

- **`localesDir`** must exist (resolved from config) when you need it — e.g. for **`--target`**, or when the **source locale** path lives under that directory in your layout.
- The **output file** must be writable (create parent dirs only if the product decision says so — otherwise fail with a clear error).

If the **source locale** file is **missing** when it is the chosen target, or **`localesDir`** is **missing** when required, exit **non-zero** with an actionable message — same spirit as other commands that require paths on disk. No prompts to “fix” this in v1.

```bash
i18nprune missing --yes
i18nprune missing --dry-run
i18nprune missing --dry-run --top 5
i18nprune missing --target ja,ar --yes
```

**Does not** call translation APIs. It **merges a placeholder string** at each new path. The default is **`__I18NPRUNE_MISSING__`** (`DEFAULT_MISSING_LEAF_PLACEHOLDER` in **`@i18nprune/core`**) so you can **`grep`** / lint for scaffolded keys; set **`missing.placeholder`** in config to use your own sentinel (or **`""`** if you deliberately want empty-string leaves).

## End-to-end flow

1. **Load config** — `source`, `localesDir`, `src`, `functions`, optional `missing` namespace (see [Command namespaces in config](../../config/commands.md)).
2. **Resolve write target(s)** — absolute path to **`config.source`** or existing **`locales/<code>.json`** files (see table above). Missing requested target locale files are skipped with warnings.
3. **Read** that JSON and collect existing **string leaf** paths (nested objects that are not string leaves do not count as “present” for a dotted key).
4. **Scan** `src` for translation calls and extract **literal** key strings (same pipeline as **`validate`**).
5. **Compute `toAdd`** — literals in code that are not yet string leaves in the target file.
6. **Human mode, real write:** print preview (respecting **`--top`** / **`--full`** defaults), then **confirm each target** unless **`--yes`** or non-interactive rules apply; on success, merge the resolved placeholder at each path and **write** the file.
7. **`--dry-run` / `--json`** — no write; **`--json`** prints the full **`paths`** array.

## Config and environment

| Mechanism | Role |
|-----------|------|
| **`config.source`**, **`localesDir`**, **`src`**, **`functions`** | Required; define which file is updated and what counts as a translation call. |
| **`config.missing.placeholder`** | String merged at each new path; omit → **`__I18NPRUNE_MISSING__`** (see [Command namespaces](../../config/commands.md)). |
| **`CI`** | With other rules, suppresses interactive **confirmation** in automation; use **`--yes`** to write. |

## How it works

1. **Scan** the project (`src`, **`functions`**) the same way **`validate`** does.
2. **Compute** which literal keys appear in code but are **not** yet present in the **chosen JSON file** (the **source locale** file by default, or existing **`locales/<target>.json`** files when **`--target`** is set).
3. **Merge** those paths into that file with placeholders.
4. **Write** the file (unless **`--dry-run`**).

**Default vs `--target`**

- **Default (source locale file):** The paths match what **`validate`** calls “missing” (code vs **source locale** JSON).
- **`--target <code[,code]|all>`:** The paths are “in code but not in **this target file**” — they can **differ** from **`validate`’s** list whenever the **source locale** and target locales are out of sync (e.g. after **`missing`** on source but before **`sync`**).

## Recommended pipeline (source locale default)

When you use the **default** (update **source locale** only):

1. **`missing`** — **source locale** JSON gains keys the code references.
2. **`sync`** — other locale files under **`localesDir`** match the **source locale** shape.
3. **`generate --resume`** — **re-translate** review-eligible leaves in target locales that still **match the source locale** string (stale source-identical copies). Does not invent keys; only existing paths.
4. **`validate`** — confirm code vs **source locale** JSON.
5. **`quality`** / **`review`** — parity and per-locale review.

When you use **`--target <code[,code]|all>`** instead, **`sync`** / **`generate --resume`** / **`validate`** still follow the same roles: **`validate`** is defined against the **source locale** file, so keep that file in sync before relying on a green **`validate`** for the whole project.

## Flags

**`missing`-specific**

| Flag | Role |
|------|------|
| **`--target <code[,code]\|all>`** | Write into existing **`locales/<code>.json`** file(s) instead of the **source locale** file. Optional. Normalized like other commands (e.g. **`pt-br`**). Missing files warn and skip. |
| **`--dry-run`** | List paths that **would** be added; **no** file write. Preview uses **`--top`** / **`--full`**. |
| **`--top <n>`** | Human listings show at most **`n`** paths. Default cap if omitted: **10**. Ignored with **`--full`**. Must be a **positive integer** (validated like **`locales dynamic --top`**). |
| **`--full`** | Human listings print **every** path (overrides **`--top`**). |

**Global (same as other commands)**

| Flag | Role |
|------|------|
| **`--json`** with shell redirection** | Structured run report at end (when this command is wired into the report session). See [Examples](../../examples/README.md). |
| **`-q` / `-s`**, **`--json`** | Verbosity and machine-readable mode; see [JSON & long runs](../../behavior/json-long.md). |
| **`--yes`** (global) | Skip the write **confirmation** and proceed (required for non-interactive writes). |

## CI / `--json` / non-interactive

- **`--target`** is optional; if omitted, the **source locale** file is the target (see table above).
- **Global `--json`:** Machine-readable stdout; **no** confirmation prompt. The **`paths`** array is always **complete** (not capped by **`--top`**).
- **Writes without a TTY:** use **`--yes`** (or **`--dry-run`** to preview only). Otherwise the command fails with a clear **`USAGE`** message.
- **Missing paths on disk:** See **Preconditions** — fail fast.

## Troubleshooting

- **Answering “No” at confirmation** exits **0** with a note — the command **did** run; no file was changed. This is not a bug.
- **`i18nprune missing -`** — a lone **`-`** is not a supported flag; pass **`--dry-run`**, **`--top`**, etc. explicitly.
- **Ctrl+C at the prompt** exits non-zero (`User force closed the prompt with SIGINT`) — expected.
- **After a successful write, the next run still lists the same paths:** the tool only treats a key as present if it exists as a **string leaf** in the **exact** JSON file shown in the log. Check: **`config.source`** (or **`--target`**) points at the file your app loads, the file on disk saved (not reverted by another process), and **`i18nprune validate --json`** shows **`missing: []`** for the source file. Mixed **object vs string** at a path can make the key look “still missing.”

## Relation to other commands

| Command | Role |
|---------|------|
| **`validate`** | Read-only; compares code to **source locale** JSON and lists **missing** + **dynamic** sites. |
| **`missing`** | **Writes** placeholders into **source locale** JSON by default, or into existing **`locales/<locale>.json`** files with **`--target`**. |
| **`sync`** | Aligns **non-source** locale files to the **source locale** shape. |
| **`generate --resume`** | **Re-translates** eligible string leaves in a **target** locale that still **match the source locale** value (does not add new key paths). |
| **`generate`** | Builds a **new target** locale from the **source locale** via the translator — different from **`missing`**. |

## See also

- [validate](../validate/README.md)
- [sync](../sync/README.md)
- [generate](../generate/README.md)
- [CLI overview](../../cli/README.md)
- [Exit codes & behavior](../../behavior/README.md)
