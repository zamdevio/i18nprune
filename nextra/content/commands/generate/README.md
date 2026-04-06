# `generate`

Generates a **target locale JSON** from the source: nested structure preserved; string leaves translated (Google `gtx` provider).

```bash
i18nprune generate --lang ja
i18nprune generate --lang pt-br --dry-run
```

## Progress and translation

- **Live progress** is written to **stderr** (multi-line bar + key + timing on a TTY when allowed). It is **off** for **`--json`**, **`-q`**, **`-s`**, or non-TTY stderr — see [Translation progress](../../progress/README.md).
- **`--dry-run`** still walks every leaf and updates the progress UI but **does not** call the API or write under **`localesDir`**. When **`--json`** is off and **`--quiet` / `--silent`** are off, **`logger.info`** summarizes what **would** have been written (no **`Wrote …`** success lines).
- String work goes through **`translateLeaf`** (mask → provider → restore → validate; retries). See [Translator & progress](../../architecture/translator-and-progress.md).

## Source locale (not a target)

The configured **source** JSON (basename of `source`, e.g. `en`) is the **source of truth**. It is **not** a valid **`--lang`** for **`generate`** — use it only as the reference file; pick a **target** catalog code instead.

## Meta file (default) and `--no-meta`

By default, **`generate`** writes **`<lang>.meta.json`** next to **`<lang>.json`** with:

- **`lang`** — target code  
- **`englishName`** — English label  
- **`nativeName`** — native endonym  
- **`direction`** — **`ltr`** or **`rtl`**

**`--no-meta`** skips creating or updating that file. Use it when you do not want sidecar metadata (e.g. you only need the locale JSON, or you maintain metadata elsewhere).

If you pass **`--english-name`**, **`--native-name`**, or **`--direction`**, those values override catalog defaults for the meta file (when meta is not disabled).

**Direction vs catalog:** The bundled **`languages.json`** rows are **`code`**, **`english`**, and **`native`** only. **Layout direction** is not stored in the catalog yet. It defaults to **`ltr`**; pass **`--direction rtl`** for RTL targets (or pick **rtl** in the interactive direction menu). Meta prompts pre-fill English/native from the catalog so **Enter** keeps those defaults.

## Interactive vs non-interactive

| Mode | Language (`--lang`) | Meta (English/native/direction, `.meta.json`) |
|------|---------------------|-----------------------------------------------|
| **TTY, not forcing machine-only** | Prompts if omitted (when implemented); choose code and optional fields. | Prompts where applicable; **Enter** accepts **catalog defaults** for English and native names. **Direction** uses an interactive **menu** (**ltr** / **rtl**), defaulting to **ltr** or to **`--direction`** if you passed it. |
| **Non-interactive** (no TTY, `CI=1`, `I18NPRUNE_NO_INIT=1`, or global **`--json`**) | **`--lang` is required.** | When **`--lang` is set** and is a **valid catalog code**, **English** and **native** names default from **`languages.json`** unless you override with **`--english-name`** / **`--native-name`** / **`--no-meta`**. **Direction** defaults to **`ltr`** unless you pass **`--direction rtl`**. |

**Non-interactive validation**

- **Missing `--lang`:** fail fast with a clear usage or configuration error; **exit code non-zero** (typically **1** or **2** for usage-class errors — see [Exit codes & behavior](../../behavior/README.md)).
- **`--lang` not in the bundled catalog** (unknown or unsupported code after normalization): **fail fast** with an error that names the code and points you at **`i18nprune languages`** and the docs; **exit non-zero**.

When a config file already exists, **`generate`** does **not** print the informational **`Config already exists …`** line (same **`silentIfExists`** behaviour as **`locales`** — see [Roadmap](../../roadmap/README.md)).

See global **`--json`**, **`--quiet`**, **`--silent`**, and [JSON mode & long commands](../../behavior/json-long.md).

## Roadmap

Catalog defaults and validation rules for **`generate`** are covered in [Roadmap](../../roadmap/README.md) and maintainer handoff (**`CURRENT_PHASE.md`**, gitignored).
