# `languages` (`langs`)

**Full examples:** [languages examples](../../examples/commands/languages/README.md)

Lists every **translation target** language the CLI knows about (code, English name, native name). Use this when choosing **`locales.source`** in config or a **`generate --target`** code — the same catalog backs **`Unsupported language code "…" — try: …`** hints during config load and generate.

```bash
i18nprune languages
i18nprune langs --filter ja
i18nprune languages --table
```

**Alias:** `langs` (same as `languages`). This command does **not** load your project config or run readiness — it always lists the built-in catalog.

**`--json`** prints the catalog as JSON. **Does not require** an `i18nprune.config.*` file.

When **`locales.source`** is wrong, fix the tag (e.g. `en`, not `en.json` or `messages/en/app.json`). If the tag is unknown, the error suggests nearby catalog codes — run **`i18nprune languages`** to browse the full list. See also [Project issues — `locales_source_not_language_code`](../issues/project.md#locales_source_not_language_code).
