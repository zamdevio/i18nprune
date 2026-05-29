# svelte-kit

SvelteKit-shaped stack smoke: `.svelte` + `locale_directory` / `locale_per_dir` with **five JSON files per locale**:

| Segment | Keys (examples) | Used in |
| --- | --- | --- |
| `messages/en/app.json` | `app.title`, `app.tagline` | `src/routes/+page.svelte` |
| `messages/en/nav.json` | `nav.home`, `nav.settings` | `src/lib/Nav.svelte` (imported from `+page`) |
| `messages/en/footer.json` | `footer.copyright`, `footer.privacy` | `src/lib/Footer.svelte` |
| `messages/en/errors.json` | `errors.load_failed` | `+page.svelte` |
| `messages/en/forms.json` | `forms.save` | `+page.svelte` |

`i18nprune generate` is **schema-first**: each segment only receives keys that appear in extracted source **and** in that segment’s source JSON. An empty `ar/nav.json` usually means nav keys were not in the generate schema set (e.g. component not scanned) — not a write bug.

```bash
cd tests/fixtures/stacks/svelte-kit
node ../../../../dist/cli.js validate --json
node ../../../../dist/cli.js generate --target ar --dry-run
```
