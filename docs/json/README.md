# JSON output (`--json`)

**Canonical spec** for machine-readable CLI output and the shared envelope used by the CLI and programmatic helpers.

**See also:** [Programmatic API and the CLI JSON contract](./programmatic.md) — headless `Result` roadmap, types, phase links (no duplicate of the envelope spec).

<a id="report-json-on-disk-vs-cli-json-stdout"></a>

## Report JSON on disk vs CLI JSON stdout

**This is expected — two different JSON shapes for two jobs.** (`validate --json` refers to global `--json` on that subcommand; see [Global `--json`](#global-json).)

| What you run | What you get |
|----------------|--------------|
| `i18nprune report --format json --out reports/out.json` | The **report file body** embedded in / consumed by the report UI: top-level `kind: "i18nprune.projectReport"`, `schemaVersion`, `project`, … — **not** a `CliJsonEnvelope`. |
| `i18nprune validate --json` (and other subcommands that support global `--json`) | A **`CliJsonEnvelope`** on stdout: `ok`, `kind`, `data`, `issues`, `meta` — the [machine-readable CLI contract](#shape-of-stdout-primary-json-commands). |

For **`report`** specifically: **`--format`** selects the **on-disk artifact** (`html`, `json`, `csv`, `text`). Global **`--json`** is separate — it adds the **stdout envelope**; see [Report command](../commands/report/README.md#global-json) and the **`report`** row under [Commands that emit](#commands-that-emit-a-primary-stdout-envelope) below.

---

## Global `--json`

### What it does

- On the root Commander program, **`--json`** is **always parsed** (it affects duplicate-config resolution and non-interactive behavior the same way as today).
- **Structured JSON on stdout** is emitted **only** when **both** are true:
  1. The user passed **`--json`**, and  
  2. The **subcommand** supports JSON output (see list below).

If the command does **not** support JSON (e.g. **`init`**, **`help`**), **`--json`** is ignored for stdout: those commands use normal human-oriented output (still respecting **`-q` / `-s`** where applicable).

### Commands that emit a primary stdout envelope

Source of truth: `packages/cli/src/constants/jsonoutput.ts`.

With global **`--json`**, these subcommands print **one primary `CliJsonEnvelope`** on stdout (same shape as [programmatic](./programmatic.md) **`run*`** helpers): **`config`**, **`validate`**, **`missing`**, **`sync`**, **`generate`**, **`fill`**, **`quality`**, **`review`**, **`cleanup`**, **`languages`**, **`doctor`**, **`report`**, and the **`locales`** leaf names **`list`**, **`edit`**, **`dynamic`**, **`delete`** (see [Locales](../commands/locales/README.md)).
            
- **`generate`:** `data` is a summary payload (`targets`, `dryRun`, per-target rows with optional **`progress`**, leaf counts, dynamic key-site count) — not per-leaf translation traces. See [Generate command](../commands/generate/README.md#json-mode-primary-envelope).
- **`fill`:** `data.targetResults[]` includes per-target **`progress`** (**`TargetProgressSummary`**) alongside paths and counts. See [Fill command](../commands/fill/README.md).
- **`locales`:** each implemented subcommand uses its own envelope **`kind`** (`locales-list`, `locales-edit`, `locales-dynamic`, `locales-delete`); typed under `packages/cli/src/types/command/locales/json.ts`.
- **`report`:** still uses **`--format`** for the **on-disk** artifact (`html`, `json`, `csv`, `text`). Global **`--json`** adds the **stdout envelope**; `data.document` is the same **`i18nprune.projectReport`** object (and `data.outputPath` is the resolved write path, or `null` if skipped). See [Report command](../commands/report/README.md#global-json). If **`--out`** already exists, **`--json`** (like CI / **`--yes`**) uses **keep-both** without prompting — [existing paths](../commands/report/README.md#existing-output-paths-report--out-and-global---report-file).
- **`validate`:** **`data.count`** equals **`data.keyObservations.count`** (scanned literal keys); missing keys are **`data.missing`**. See [Validate command](../commands/validate/README.md).

### Shape of stdout (primary JSON commands)

For commands that emit a **primary** JSON **document** on stdout, each document is a single line (or pretty-printed block for a few commands) of:

```json
{
  "ok": true,
  "kind": "<command-id>",
  "data": { },
  "issues": [],
  "meta": { "apiVersion": "1", "cwd": "..." }
}
```

| Field | Meaning |
|-------|---------|
| **`ok`** | Domain outcome for that command (e.g. `validate`: no missing literal keys; `doctor`: would exit 0). |
| **`kind`** | Envelope discriminator: `validate`, `missing`, `sync`, `cleanup`, `config`, `doctor`, `languages`, `review`, `quality`, `generate`, `fill`, `locales-list`, `locales-edit`, `locales-dynamic`, `locales-delete`, `report`, `summary`, … |
| **`data`** | Command-specific payload (typed under `packages/cli/src/types/command/*/json.ts` where applicable; envelope types in `packages/cli/src/types/core/json/envelope.ts`). Inner `kind` fields (e.g. `missing`, `i18nprune.config`, `localeReview`) describe the **payload**, not the envelope. |
| **`issues`** | Structured warnings/errors for integrators. Codes are stable strings — see **[issue codes](./issue-codes.md)**. Every command that emits a primary **`--json`** document populates **`issues[]`** (may be empty). |
| **`meta.apiVersion`** | Envelope contract version (`1`). Bump when envelope **semantics** change. |
| **`meta.cwd`** | Working directory at emit time. |

Each **`Issue`** may include **`docHref`** (absolute URL to the hosted docs, including the **`#anchor`** for that code) and optionally **`docPath`** (repo-relative path under **`docs/`**, e.g. `docs/json/issue-codes` or `docs/commands/quality/README`). Prefer **`docHref`** in UIs and agents so readers land on the right subsection without guessing the site origin.

**Consumers:** read **`kind`** and **`ok`**, then inspect **`data`**. Do not assume fields exist at the top level except those five envelope keys.

### Pretty-printing

`config`, `doctor`, `review`, and `languages` use indented JSON for readability in CI logs. Other commands use compact single-line JSON.

### Long-running commands

How **`--json`** interacts with prompts, progress, and stdout for **`generate`**, **`fill`**, **`sync`**, …: **[`--json` and long-running commands](../behavior/json-long.md)**.

---

## Programmatic API

From **`@zamdevio/i18nprune/core`**:

- **`RESULT_API_VERSION`**, **`buildCliJsonEnvelope`**, **`stringifyCliCommandJson`**
- **`tryResolveContext`**, **`runValidate`** — headless context + same envelope as **`validate --json`** (see [programmatic](./programmatic.md))
- Types: **`Issue`**, **`CliJsonEnvelope`**, **`Result`**, **`OkResult`**, **`ErrResult`**, **`ResultMeta`**
- Issue code constants: **`ISSUE_*`** (see [issue codes](./issue-codes.md))

Use the same types when building tools that mirror CLI output.

---

## Merged source text vs per-file scans

If you concatenate all source into **one string** and run helpers that expect merged text, **per-file** metadata (paths, comment suppression, **per-file const maps**) is absent. For accurate keys and locations, use **`scanProjectKeyObservations`** / **`scanProjectDynamicKeySites`** (per-file). See [Per-file const maps](../edge-cases/solved/per-file-const-map.md).
