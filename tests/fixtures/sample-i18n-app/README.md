# sample-i18n-app

Minimal **fake project** used by **Vitest integration tests** and for **manual CLI** practice. It lives under `tests/fixtures/sample-i18n-app` in the i18nprune repo.

**Goal:** run real commands against a tiny tree (`src/`, `locales/`, `i18nprune.config.mjs`) without touching your production app. `**targets.json`** lists locale codes you can loop for `**generate**` drills.

---

## Prerequisite

### Option A — install from npm

```bash
npm install -g @zamdevio/i18nprune
cd /path/to/i18nprune/tests/fixtures/sample-i18n-app
```

### Option B — link the repo CLI after a local build

From the **repository root** (after `pnpm install`):

```bash
pnpm build
npm link
```

That wires the workspace `bin` (`i18nprune` → `dist/cli.js`) onto your PATH. Then:

```bash
cd tests/fixtures/sample-i18n-app
```

### Option C — `node` the built entrypoint (no link)

From the **repository root**:

```bash
pnpm build
cd tests/fixtures/sample-i18n-app
```

```bash
node ../../../dist/cli.js <command> [flags]
```

Below, `**i18nprune**` means “however you invoke the CLI” from this directory.

---

## Quick checks (human output)

```bash
i18nprune doctor
i18nprune config
i18nprune validate
i18nprune missing --dry-run
i18nprune sync --dry-run
i18nprune review
i18nprune languages --table
```

---

## JSON-first (CI-style)

Every command prints **one primary `CliJsonEnvelope`** on stdout (same shape as [JSON output](https://docs.i18nprune.dev/json/README) docs). Append `**| jq**` for readable JSON.

```bash
i18nprune validate --json | jq
i18nprune config --json | jq
i18nprune doctor --json | jq
i18nprune sync --json | jq
i18nprune missing --dry-run --json | jq
i18nprune review --json | jq
i18nprune quality --json | jq
i18nprune cleanup --check-only --json | jq
```

**Gate on success:**

```bash
i18nprune validate --json | jq -e '.ok'
```

**Note:** `**cleanup --json`** includes timing under **`data.summary`** in the **same** stdout envelope as the cleanup payload (no extra `kind: summary` line). Human mode (without `**--json**`) still prints a text footer from some commands.

---

## `targets.json` — batch generate

File shape:

```json
{
  "targets": ["fr", "ja", "it", "es", "so", "de"]
}
```

**One `generate` per line** (multiple JSON objects printed back-to-back — valid for NDJSON-style parsing):

```bash
jq -r '.targets[]' targets.json | xargs -I {} i18nprune generate --target {} --json
```

Pretty-print **each** envelope (still **one object per invocation**):

```bash
jq -r '.targets[]' targets.json | xargs -I {} i18nprune generate --target {} --json | jq
```

**Single envelope** for comma-separated targets (one process, one stdout document):

```bash
i18nprune generate --target fr,ja,it --json | jq
```

Dry-run (no API / no writes):

```bash
i18nprune generate --target so --dry-run --json | jq
```

---

## Fill & sync

```bash
i18nprune fill --all --dry-run --json | jq
i18nprune fill --target fr --dry-run --json | jq
i18nprune sync --json | jq '.data.files'
```

---

## Timing

```bash
time i18nprune validate --json | jq -e '.ok'
time i18nprune sync --json | jq
```

---

## Experiment safely

- Edit `**locales/en.json**` and `**src/main.ts**` to try missing keys / literals.
- Avoid comments that look like `**t('…')**` — the extractor scans the whole `**src/**` tree.

---

## See also

- Marketing **Examples** (shorter curated list): [i18nprune.dev/examples](https://i18nprune.dev/examples)  
- **Benchmark / performance** framing: [i18nprune.dev/benchmark](https://i18nprune.dev/benchmark)

